"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form-input-type");
const inputDistance = document.querySelector(".form-input-distance");
const inputDuration = document.querySelector(".form-input-duration");
const inputCadence = document.querySelector(".form-input-cadence");
const inputElevation = document.querySelector(".form-input-elevation");
const deleteBtn = document.querySelector("#delete-btn");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat,lng ]
    this.distance = distance; // in km
    this.duration = duration; // in minutes
  }

  _setDescription() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, candence) {
    super(coords, distance, duration);
    this.candence = candence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    //  min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    //  km/min
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// * const run1 = new Running([39, -12], 5.2, 24, 180);
//*  const cycling1 = new Cycling([39, -12], 27, 95, 500);
// * console.log(run1, cycling1);

//------------------ APPLICATION ARCHITECTURE --------------------
class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPostion();
    this._getLocalStorage();
    form.addEventListener("submit", this._newWorkout.bind(this));

    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._moveToPopUp.bind(this));
  }

  _getPostion() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Was not able to get your possition! ");
        }
      );
    }
  }

  _loadMap(possition) {
    const { latitude } = possition.coords;
    const { longitude } = possition.coords;

    const coords = [latitude, longitude];

    console.log(this);

    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //  handling clicks on Map
    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach((work) => {
      this._displayMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");

    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        "";

    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => {
      form.style.display = "grid";
    }, 500);
  }

  _toggleElevationField() {
    inputElevation.closest(".form-row").classList.toggle("form-row-hidden");
    inputCadence.closest(".form-row").classList.toggle("form-row-hidden");
  }

  _newWorkout(e) {
    //  helper function
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));

    const allPosstive = (...inputs) => inputs.every((inp) => inp > 0);

    e.preventDefault();

    // ! get data from the form

    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // ! if workout ? running ? create running object

    if (workout) {
      deleteBtn.classList.add("hidden");
    } else {
      deleteBtn.classList.remove("hidden");
    }

    if (type === "running") {
      const candence = Number(inputCadence.value);
      // ! check id data is valid
      if (
        !validInputs(distance, duration, candence) ||
        !allPosstive(distance, duration, candence)
      )
        return alert("Input have to be possitive numbers");

      workout = new Running([lat, lng], distance, duration, candence);
    }

    // ! if workout ?  cycling ? create cycling object

    if (type === "cycling") {
      const elevation = Number(inputElevation.value);
      if (
        !validInputs(distance, duration, elevation) ||
        !allPosstive(distance, duration)
      )
        return alert("Input have to be possitive numbers");

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // ! add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);
    // ! render workout on map as marker

    this._displayMarker(workout);

    // ! render workout on list
    this._renderWorkout(workout);

    // ! hide form + clear inputs
    this._hideForm();

    // ! set local storage to all workouts
    this._setLocalStorage();
  }

  _displayMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        workout?.type === "running"
          ? `${workout?.description} 🏃‍♂️`
          : `${workout?.description} 🚴‍♀️`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
                <li class="workout workout-${workout.type}" data-id="${
      workout.id
    }">
                <h2 class="workout-title">${workout.description}</h2>
                <div class="workout-details">
                    <span class="workout-icon">${
                      workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
                    }</span>
                    <span class="workout-value">${workout.distance}</span>
                    <span class="workout-unit">km</span>
                </div>
                <div class="workout-details">
                    <span class="workout-icon">⏱</span>
                    <span class="workout-value">${workout.duration}</span>
                    <span class="workout-unit">min</span>
                </div>   
      `;

    if (workout.type === "running") {
      html += `
                <div class="workout-details">
                    <span class="workout-icon">⚡️</span>
                    <span class="workout-value">${workout.pace.toFixed(
                      1
                    )}</span>
                    <span class="workout-unit">min/km</span>
                </div>
                <div class="workout-details">
                    <span class="workout-icon">🦶🏼</span>
                    <span class="workout-value">${workout.candence}</span>
                    <span class="workout-unit">spm</span>
                </div>
                </li>
        `;
    }

    if (workout.type === "cycling") {
      html += `
        
                <div class="workout-details">
                    <span class="workout-icon">⚡️</span>
                    <span class="workout-value">${workout.speed.toFixed(
                      1
                    )}</span>
                    <span class="workout-unit">km/h</span>
                </div>
                <div class="workout-details">
                    <span class="workout-icon">⛰</span>
                    <span class="workout-value">${workout.elevationGain}</span>
                    <span class="workout-unit">m</span>
                </div>
              </li>
        `;
    }
    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopUp(e) {
    const workoutEl = e.target.closest(".workout");

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    console.log(workout);

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    console.log(data);

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });

    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

const app = new App();
//  app._getPostion();

deleteBtn.addEventListener("click", () => {
  app.reset();
});
