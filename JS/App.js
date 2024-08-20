// ----- JS code -----

"use strict";

// ===== consts =====
const API_KEY = "A2UXOKULQXaYjcETKNJemoP0PxghqorLKaWNPuz6";
const roversInfoURL = `https://api.nasa.gov/mars-photos/api/v1/rovers?api_key=${API_KEY}`;

// common DOM elements:
const roverSelection = document.getElementById("rovers");
const camerasList = document.getElementById("cameras");
const dateFormatSelection = document.getElementById("dateFormat");
const solInput = document.getElementById("sol");
const earthDateInput = document.getElementById("earthDate");
const carouselSection = document.getElementById("carousel");
const noImagesFoundMsg = document.getElementById("noImages");
const searchResults = document.getElementById("searchResults");
const spinner = document.getElementById("spinner");
const fetchCatchError = document.querySelector("#data");
const solError = document.getElementById("solError");
const earthDateError = document.getElementById("earthDateError");
const imagesFoundFromSearch = document.getElementById("imagesFound");



// ===== modules =====

/*
This module is responsible for the fetch functions and showing/updating the data from the server's response:
*/
const serverRequests = ( () => {
    // private members:
    let roversData = [];

    // the object that will be returned
    let fetchFuncs = {};

    // ----- private methods -----
    /**
     * This function checks if the response from the server was OK or if there's an error:
     * @param response - the response from the server
     * @returns {Promise<never>|Promise<Awaited<unknown>>}
     */
    function status(response) {
        if (response.status >= 200 && response.status < 300) {
            return Promise.resolve(response)
        } else {
            return Promise.reject(new Error(response.statusText))
        }
    }

    //////////

    /**
     * This function presents the images that were found from the search:
     * @param json - the corresponding json object from the server.
     */
    function showImages(json) {
        // checking if any photos were received from the search:
        if (json.photos.length === 0)
        {
            noImagesFoundMsg.classList.remove("d-none");
        }

        else {
            noImagesFoundMsg.classList.add("d-none");

            // showing the images that came up from the search:

            // shows the first fifteen images:
            for (let i = 0 ; (i < 15) && (i < json.photos.length) ; i++) {
                const image = json.photos[i];

                // creating a new col:
                const newCol = document.createElement("div");
                newCol.classList.add("col-xxs-4", "col-sm-4", "mb-3");

                // creating a new image card:
                const newImageCard = document.createElement('div');
                newImageCard.classList.add("card");

                const imageCardBody = document.createElement('div');
                imageCardBody.classList.add("card-body");

                // saving the image's details:
                const imageEarthDate = document.createElement('p');
                imageEarthDate.classList.add("card-text");
                imageEarthDate.textContent = `Earth date: ${image.earth_date}`;
                const imageSol = document.createElement('p');
                imageSol.classList.add("card-text");
                imageSol.textContent = `Sol: ${image.sol}`;
                const imageCamera = document.createElement('p');
                imageCamera.classList.add("card-text");
                imageCamera.textContent = `Camera: ${image.camera.name}`;
                const imageRover = document.createElement('p');
                imageRover.classList.add("card-text");
                imageRover.textContent = `Mission: ${image.rover.name}`;

                // Creating the img tag for the image:
                const imageForCard = document.createElement('img');
                imageForCard.src = image.img_src;
                imageForCard.classList.add("img-fluid", "card-img-top");

                // Creating the buttons for the image card:
                // "save" button:
                const saveImageButton = document.createElement('button');
                saveImageButton.classList.add("btn", "btn-success", "mt-1", "mx-1");
                saveImageButton.textContent = "Save";
                saveImageButton.addEventListener('click', function () {
                    const imageDetails = {};
                    imageDetails.earthDate = image.earth_date;
                    imageDetails.sol = image.sol;
                    imageDetails.camera = image.camera.name;
                    imageDetails.mission = image.rover.name;
                    imageDetails.imgSrc = image.img_src;
                    savedImages.addImage(imageDetails);

                });

                // "full size" button:
                const fullSizeButton = document.createElement('a');
                fullSizeButton.classList.add("btn", "btn-primary", "mx-1", "mt-1");
                fullSizeButton.textContent = "Full size";
                fullSizeButton.role = "button";
                fullSizeButton.href = image.img_src;
                fullSizeButton.target = "_blank";


                // building the image card itself:
                imageCardBody.appendChild(imageEarthDate);
                imageCardBody.appendChild(imageSol);
                imageCardBody.appendChild(imageCamera);
                imageCardBody.appendChild(imageRover);
                imageCardBody.appendChild(saveImageButton);
                imageCardBody.appendChild(fullSizeButton);
                newImageCard.appendChild(imageForCard);
                newImageCard.appendChild(imageCardBody);
                newCol.appendChild(newImageCard);

                // adding the card image to the search results:
                imagesFoundFromSearch.appendChild(newCol);


            }
        }

        // removing the spinner:
        let imgElement = spinner.querySelector('img');
        if (imgElement) {
            spinner.removeChild(imgElement);
        }

    }



    // ----- public methods -----
    /**
     * This function gets the info about the rovers from the server and saves it:
     */
    fetchFuncs.getRoversData = function () {
        fetch(roversInfoURL)
            .then(status)
            .then(response => response.json())
            .then(json => {
                if (json.rovers && json.rovers.length > 0) {
                    json.rovers.forEach(rover => {
                        // adding the rover name to the rovers selection field of the form:
                        const option = document.createElement('option');
                        option.value = rover.name;
                        option.text = rover.name;
                        roverSelection.appendChild(option);

                        // saving the rover's info for validation:
                        const roverInfo = {};
                        roverInfo.name = rover.name;
                        roverInfo.landingDate = rover.landing_date;
                        roverInfo.maxDate = rover.max_date;
                        roverInfo.maxSol = rover.max_sol;
                        roverInfo.cameras = rover.cameras;
                        roversData.push(roverInfo);

                    });

                } else {
                    console.error('The "rovers" array is empty or undefined.');
                }

            })


            .catch(function(err) {
                fetchCatchError.innerHTML = "something went wrong...try again later";
            });
    }

    //////////

    /**
     * This function returns the rovers data array.
     * @returns {*[]} - the data structure that holds the information about the rovers.
     */
    fetchFuncs.getRoversArray = function () {
        return roversData;
    }

    //////////

    /**
     * This function searches/gets images from the server according to the user's inputs.
     * @param rover - the name of the chosen rover.
     * @param date - the chosen date, can be either Earth date or Sol day.
     * @param camera - the chosen camera for the rover.
     */
    fetchFuncs.getImages = function (rover, date, camera) {
        spinner.innerHTML=`<img src="images/animated_loader_gif_n6b5x0.gif" alt="spinner gif"/>`;
        searchResults.classList.add("d-none");

        let imagesURL;

        // checking which date format was chosen in order to get the corresponding URL:
        if (dateFormatSelection.value === "Earth date") {
            imagesURL = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}`
                + `/photos?earth_date=${date}&camera=${camera}&api_key=${API_KEY}`;
        }
        else {
            imagesURL = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}`
                + `/photos?sol=${date}&camera=${camera}&api_key=${API_KEY}`;
        }

        fetch(imagesURL)
            .then(status)
            .then(response => response.json())
            .then(showImages)

            .catch(function(err) {
                fetchCatchError.innerHTML = "something went wrong...try again later";
            });

        searchResults.classList.remove("d-none");


    }

    return fetchFuncs;

}) ();

/////////////////

// This module is for handling the saved images page and list:
const savedImages = ( () => {
    // private members:
    let savedImagesList = [];
    const savedImagesSection = document.getElementById("savedImagesList");
    const carouselBody = document.querySelector(".carousel-inner");
    const noSavedImagesMessage = document.getElementById("noSavedImages");
    const saveErrorModal = document.getElementById('saveErrorModal');
    const saveSuccessModal = document.getElementById("saveSuccessModal");

    // the object that will be returned
    let savedImagesFuncs = {};

    // ----- private methods -----

    /**
     * This function removes an image from the 'savedImagesList' array by its index.
     * @param index - the wanted image's index in the saved images array.
     */
    function removeImage(index) {
        savedImagesList.splice(index, 1);

        // to update the saved images list after removing the image:
        savedImagesFuncs.showSavedImagesList();
    }




    // ----- public methods -----

    /**
     * This function is responsible for adding an image to the saved images array and showing the corresponding
     * message modal to the user (if the image was saved successfully or if it already exists).
     * @param imageData - An object that holds information about an image (src, camera, date, etc..).
     */
    savedImagesFuncs.addImage = function (imageData) {
        let exist = false;

        for (let image of savedImagesList) {
            if (image.imgSrc === imageData.imgSrc) {
                exist = true;
                break;
            }
        }

        if (exist) {
            const errorModal = new bootstrap.Modal(saveErrorModal);
            errorModal.show();
        }
        else {
            savedImagesList.push(imageData);
            const successModal = new bootstrap.Modal(saveSuccessModal);
            successModal.show();
            savedImagesFuncs.showSavedImagesList();
        }


    }

    ///////////

    /**
     * This function resets the images carousel:
     */
    savedImagesFuncs.resetCarousel = function () {
        carouselBody.innerHTML="";
    }

    /////////////

    /**
     * This function shows and updates the saved images list on the "Saved Images" page:
     */
    savedImagesFuncs.showSavedImagesList = function () {
        savedImagesSection.innerHTML="";

        if (savedImagesList.length === 0) {
            noSavedImagesMessage.classList.remove("d-none");
        }
        else {
            noSavedImagesMessage.classList.add("d-none");
        }

        savedImagesList.forEach((image, index) => {
            // creating a new image list item:
            const imageListItem = document.createElement("li");
            imageListItem.classList.add("list-group-item");

            // adding the image's info:
            const imageInfo = document.createElement("p");
            imageInfo.textContent = `Earth date: ${image.earthDate}, Sol: ${image.sol}, Camera: ${image.camera},` +
                ` Mission: ${image.mission}.`;

            // adding "open" button:
            const openButton = document.createElement('a');
            openButton.classList.add("btn", "btn-warning", "mx-1");
            openButton.textContent = "Open";
            openButton.role="button";
            openButton.href = image.imgSrc;
            openButton.target = "_blank";

            // adding "remove" button:
            const removeButton = document.createElement('button');
            removeButton.classList.add("btn", "btn-danger", "mx-1");
            removeButton.textContent = "Remove";
            removeButton.addEventListener('click', () => removeImage(index));

            // adding the image to the list:
            imageListItem.appendChild(imageInfo);
            imageListItem.appendChild(openButton);
            imageListItem.appendChild(removeButton);
            savedImagesSection.appendChild(imageListItem);


        });
    }

    //////////

    /**
     * This function builds an images carousel based of the saved images array:
     */
    savedImagesFuncs.buildCarousel = function () {
        // resetting the carousel:
        savedImagesFuncs.resetCarousel();

        // adding saved image to the carousel:
        if (savedImagesList.length !== 0) {
            savedImagesList.forEach((image, index)  => {
                const newCarouselItem = document.createElement('div');
                newCarouselItem.className = index === 0 ? 'carousel-item active' : 'carousel-item';

                const carouselImage = document.createElement('img');
                carouselImage.src = image.imgSrc;
                carouselImage.classList.add("d-block", "w-100");

                const imageCaption = document.createElement("div");
                imageCaption.classList.add("carousel-caption", "d-none", "d-md-block");
                const imageHeader = document.createElement("h5");
                imageHeader.textContent=`${image.earthDate}`;
                const imageInfo = document.createElement("p");
                imageInfo.textContent = `Sol: ${image.sol}, Camera: ${image.camera}, Mission: ${image.mission}`;

                imageCaption.appendChild(imageHeader);
                imageCaption.appendChild(imageInfo);

                newCarouselItem.appendChild(carouselImage);
                newCarouselItem.appendChild(imageCaption);
                carouselBody.appendChild(newCarouselItem);
            });

            carouselSection.classList.remove("d-none");
        }
    }

    return savedImagesFuncs;
}) ();

/////////////////

// This module is for the event listeners' functions:
const eventsFunctions = ( () => {
    // private members:
    const earthDateField = document.getElementById("earthField");
    const solDayField = document.getElementById("solField");
    const roversArr = serverRequests.getRoversArray();
    const form = document.getElementsByTagName("form")[0];
    const formHeader = document.getElementById("header");
    const savedImagesPage = document.getElementById("savedImagesPage");

    // the object that will be returned
    let eventListenersFunctions = {};

    // ----- private methods -----



    // ----- public methods -----

    /**
     * This function updates the Earth date / Sol day field in the form according to the date format the user chooses:
     */
    eventListenersFunctions.updateDateFormat = function () {
        const dateFormatValue = dateFormatSelection.value;

        if (dateFormatValue === "Earth date") {
            earthDateField.classList.remove("d-none");
            solDayField.classList.add("d-none");
            solError.innerHTML="";
            solInput.value = "";
        }
        else if (dateFormatValue === "Mars date (Sol)") {
            earthDateField.classList.add("d-none");
            solDayField.classList.remove("d-none");
            earthDateError.innerHTML="";
            earthDateInput.value = "";
        }
        // if the user changes the option back to "Choose a date format":
        else {
            earthDateField.classList.add("d-none");
            solDayField.classList.add("d-none");
            solError.innerHTML="";
            solInput.value = "";
            earthDateError.innerHTML="";
            earthDateInput.value = "";
        }

    }

    //////////

    /**
     * This function updates the cameras selection field in the form according to the rover the user chooses:
     */
    eventListenersFunctions.updateCamerasList = function () {
        const roverChosen = roverSelection.value;

        // resetting the current cameras list (except for the default selected option "Choose a camera"):
        while (camerasList.options.length > 1) {
            camerasList.remove(1);
        }

        // adding the cameras options according to the rover chosen:
        for (let rover of roversArr) {
            if (roverChosen === rover.name) {
                rover.cameras.forEach(camera => {
                    // adding the cameras to the corresponding field in the form:
                    const option = document.createElement('option');
                    option.value = camera.name;
                    option.text = camera.full_name;
                    camerasList.appendChild(option);
                });

                break;
            }
        }

    }

    //////////

    /**
     * This function handles the "Search" button click event:
     */
    eventListenersFunctions.searchButton = function () {
        // resetting the previous search results:
        imagesFoundFromSearch.innerHTML="";
        noImagesFoundMsg.classList.add("d-none");

        if (formValidation.checkFormValidation()) {
            searchResults.classList.add("d-none");
            if (dateFormatSelection.value === "Mars date (Sol)") {
                serverRequests.getImages(roverSelection.value, solInput.value, camerasList.value);
            }
            else {
                serverRequests.getImages(roverSelection.value, earthDateInput.value, camerasList.value);
            }

        }
        else {
            searchResults.classList.add("d-none");
        }
    }

    //////////

    /**
     * This function clears and resets the form:
     */
    eventListenersFunctions.resetForm = function () {
        form.reset();
        earthDateField.classList.add("d-none");
        solDayField.classList.add("d-none");
        formValidation.resetFormErrors();
        searchResults.classList.add("d-none");
        imagesFoundFromSearch.innerHTML="";
    }

    //////////

    /**
     * This function handles the "Saved Images" button click event:
     */
    eventListenersFunctions.goToSavedImages = function () {
        form.classList.add("d-none");
        searchResults.classList.add("d-none");
        imagesFoundFromSearch.innerHTML="";
        noImagesFoundMsg.classList.add("d-none");
        formHeader.classList.add("d-none");

        savedImages.showSavedImagesList();
        savedImagesPage.classList.remove("d-none");

    }

    //////////

    /**
     * This function returns to the search form page:
     */
    eventListenersFunctions.goBackToSearch = function() {
        carouselSection.classList.add("d-none");
        form.classList.remove("d-none");
        imagesFoundFromSearch.innerHTML="";
        savedImagesPage.classList.add("d-none");
        formHeader.classList.remove("d-none");
        savedImages.resetCarousel();
    }

    //////////

    /**
     * This function handles the "start carousel" button click event:
     */
    eventListenersFunctions.startCarousel = function () {
        savedImages.buildCarousel();
    }

    //////////

    /**
     * This function handles the "stop carousel" button click event:
     */
    eventListenersFunctions.stopCarousel = function () {
        carouselSection.classList.add("d-none");
    }


    return eventListenersFunctions;

}) ();



////////////////////

/*
This module handles the form's validation functions and errors:
*/
const formValidation = ( () => {
    // private members:
    const roversArr = serverRequests.getRoversArray();
    const dateFormatError = document.getElementById("dateFormatError");
    const roverError = document.getElementById("roverError");
    const cameraError = document.getElementById("cameraError");
    let solValue, earthDateValue, roverChosen, formIsValid = true;

    // the object that will be returned
    let validators = {};

    // ----- private methods -----
    /**
     * This function checks if the user chose a date format:
     */
    function validDateFormat () {
        if (dateFormatSelection.value === "Choose a date format") {
            dateFormatError.innerHTML="Date format is needed to continue";
            formIsValid = false;
        }

        else {
            dateFormatError.innerHTML="";
        }
    }

    //////////////

    /**
     * This function checks if the Sol day value is valid according to the chosen rover:
     */
    function solDayValidation () {
        solValue = solInput.value;

        if (solValue === "") {
            solError.innerHTML="Sol day value is required";
            formIsValid = false;
        }
        else {
            solError.innerHTML="";

            for (let rover of roversArr) {
                if ((roverChosen === rover.name) && (solValue > rover.maxSol)) {
                    solError.innerHTML = `Max Sol Day for this rover is: ${rover.maxSol}`;
                    formIsValid = false;
                    break;
                }
            }
        }
    }

    //////////////

    /**
     * This function checks if the Earth date is valid according to the chosen rover:
     */
    function earthDateValidation() {
        earthDateValue = earthDateInput.value;
        let earthDate = new Date(earthDateValue);

        if (earthDateValue === "") {
            earthDateError.innerHTML="Earth date is required";
            formIsValid = false;
        }

        else {
            earthDateError.innerHTML="";

            for (let rover of roversArr) {
                if ((roverChosen === rover.name)) {
                    const landingDate = new Date(rover.landingDate);
                    const maxDate = new Date(rover.maxDate);

                    if ((earthDate >= landingDate) && (earthDate <= maxDate)) {
                        earthDateError.innerHTML="";
                    }
                    else {
                        earthDateError.innerHTML="Earth date for this rover should be between: "
                            + `${rover.landingDate} and ${rover.maxDate}`;
                        formIsValid = false;
                    }

                    break;
                }
            }
        }
    }

    ////////////

    /**
     * This function checks if the user chose a date format, and the validation of the date:
     */
    function dateValidation() {
        roverChosen = roverSelection.value;

        validDateFormat();

        if (dateFormatSelection.value === "Earth date") {
            earthDateValidation();
        }

        else if (dateFormatSelection.value === "Mars date (Sol)") {
            solDayValidation();
        }
    }

    ////////////

    /**
     * This function checks if the user chose a rover:
     */
    function roverValidation() {
        if (roverSelection.value === "Choose a rover") {
            roverError.innerHTML="Select a rover option";
            formIsValid = false;
        }

        else {
            roverError.innerHTML="";
        }
    }

    ////////////

    /**
     * This function checks if the user chose a camera:
     */
    function cameraValidation() {
        if (camerasList.value === "Choose a camera") {
            cameraError.innerHTML="Select a camera option";
            formIsValid = false;
        }

        else {
            cameraError.innerHTML="";
        }
    }

    ////////////

    /**
     * This function resets the form's error messages:
     */
    validators.resetFormErrors = function () {
        dateFormatError.innerHTML="";
        earthDateError.innerHTML="";
        solError.innerHTML="";
        roverError.innerHTML="";
        cameraError.innerHTML="";
    }


    // ----- public methods -----
    /**
     * This function checks the validation of the entire form.
     * @returns {boolean} - returns 'true' if all the inputs are valid, and 'false' if not.
     */
    validators.checkFormValidation = function () {
        formIsValid = true;

        dateValidation();
        roverValidation();
        cameraValidation();

        return formIsValid;
    }

    return validators;
}) ();









///////////////////////////////////////////////////

document.addEventListener('DOMContentLoaded', function () {
    // getting the rover's data once from the server:
    serverRequests.getRoversData();

    // event listeners:
    document.querySelector("#dateFormat").addEventListener("change", eventsFunctions.updateDateFormat);
    document.querySelector("#rovers").addEventListener("change", eventsFunctions.updateCamerasList);
    document.querySelector("#search").addEventListener("click", eventsFunctions.searchButton);
    document.querySelector("#clear").addEventListener("click", eventsFunctions.resetForm);
    document.querySelector("#savedImagesButton").addEventListener("click", eventsFunctions.goToSavedImages);
    document.querySelector("#back").addEventListener("click", eventsFunctions.goBackToSearch);
    document.querySelector("#start").addEventListener("click", eventsFunctions.startCarousel);
    document.querySelector("#stop").addEventListener("click", eventsFunctions.stopCarousel);

});


