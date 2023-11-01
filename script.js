'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
class workout {
  date = new Date();
  id = String(this.date.getTime()).slice(-4);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    this.time = this.getTime();
  }
  getTime() {
    const curMonth = months[this.date.getMonth()];
    return `${curMonth} ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}

class running extends workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.pace = duration / distance;
  }
}

class cycling extends workout {
  type = 'cycling';
  constructor(coords, distance, duration, elev) {
    super(coords, distance, duration);
    this.elev = elev;
    this.speed = distance / (duration / 60);
  }
}
class App {
  workouts = [];
  map;
  mapEvent;
  constructor() {
    this.getPosition();
    this.getLocal();

    form.addEventListener('submit', this.newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this.moveToPopup.bind(this));
  }
  getPosition() {
    navigator.geolocation.getCurrentPosition(
      this.loadMap.bind(this),
      function () {
        alert(`fail`);
      }
    );
  }

  loadMap(e) {
    const { latitude, longitude } = e.coords;
    const coords = [latitude, longitude];

    this.map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    this.map.on('click', this.showForm.bind(this));
    this.workouts.forEach(work => {
      this.render(work);
    });
  }

  showForm(mapE) {
    this.mapEvent = mapE;
    console.log(this);
    console.log(this.mapEvent);
    inputDistance.focus();

    form.classList.remove('hidden');

    inputType.addEventListener('change', this.toggle);
  }

  newWorkout(e) {
    const { lat, lng } = this.mapEvent.latlng;
    const coords = [lat, lng];
    e.preventDefault();
    const isNumber = (...inputs) => inputs.every(inp => Number.isFinite(inp));

    const isPositive = (...inputs) => inputs.every(inp => inp > 0);

    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;

    if (inputType.value === 'running') {
      const cadence = +inputCadence.value;
      if (
        !isNumber(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      )
        return;
      workout = new running(coords, distance, duration, cadence);
    }

    if (inputType.value === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !isNumber(distance, duration, elevation) ||
        !isPositive(distance, duration)
      )
        return;
      workout = new cycling(coords, distance, duration, elevation);
    }
    this.workouts.push(workout);

    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';

    this.render(workout);
    this.hideForm();
    this.insertHtml(workout);

    this.setLocalStorage();
  }
  render(workout) {
    L.marker(workout.coords)
      .addTo(this.map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type} on ${workout.time}`)
      .openPopup();
  }
  toggle(e) {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');

    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  hideForm() {
    form.classList.add('hidden');
    // form.style.display = 'none';
  }
  insertHtml(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id=${
      workout.id
    }>
    <h2 class="workout__title">${workout.type} on ${workout.time}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
   `;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    }
    if (workout.type === 'cycling') {
      html += ` <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elev}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.workouts.find(
      workout => workout.id === workoutEl.dataset.id
    );

    this.map.setView(workout.coords, 13);
    workout.click();
    console.log(workout);
  }

  setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }

  getLocal() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.workouts = data;
    this.workouts.forEach(work => this.insertHtml(work));
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const a = new App();
