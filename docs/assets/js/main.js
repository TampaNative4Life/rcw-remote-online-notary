/*
=========================================================
RCW SR. NOTARY SERVICES
FILE: assets/js/main.js

CHANGE NOTES
Version: 1.1.1
Date: August 19, 2026

Changes:
- Fixed successful form submission hanging before thank-you page.
- Removed dependency on Google Sheets response before redirect.
- Google Sheets logging now runs independently after Formspree success.
- Added navigator.sendBeacon support for spreadsheet logging.
- Added fetch keepalive fallback for browsers without sendBeacon.
- Preserved appointment form session storage.
- Preserved Review or Change My Request workflow.
- Preserved unique submission ID tracking.
- Preserved New Request versus Updated Request tracking.
- Preserved Formspree email submission.
- Preserved mobile address requirement.
- Preserved responsive navigation and current-year functions.

GITHUB COMMIT:
Fix appointment redirect and background spreadsheet logging
=========================================================
*/

"use strict";


document.addEventListener(
  "DOMContentLoaded",
  function () {


    /*
    =====================================================
    CONFIGURATION
    =====================================================
    */

    const GOOGLE_SHEETS_URL =
      "https://script.google.com/macros/s/AKfycbyaOMyJdieQHb2JKX8jZduNBDh0HkQVpEaIirkfAXqVOkVL1Gf-Z0aCm8JpM4PUw-Ur/exec";


    const STORAGE_KEY =
      "rcwAppointmentForm";


    const SUBMISSION_ID_KEY =
      "rcwSubmissionId";


    const SUBMISSION_TYPE_KEY =
      "rcwSubmissionType";


    /*
    =====================================================
    CURRENT YEAR
    =====================================================
    */

    const currentYear =
      document.getElementById(
        "current-year"
      );


    if (currentYear) {

      currentYear.textContent =
        new Date().getFullYear();

    }


    /*
    =====================================================
    MOBILE NAVIGATION
    =====================================================
    */

    const menuToggle =
      document.querySelector(
        ".menu-toggle"
      );


    const primaryNav =
      document.querySelector(
        ".primary-nav"
      );


    if (
      menuToggle &&
      primaryNav
    ) {

      menuToggle.addEventListener(
        "click",
        function () {

          const isOpen =
            primaryNav.classList.toggle(
              "open"
            );


          menuToggle.setAttribute(
            "aria-expanded",
            isOpen
              ? "true"
              : "false"
          );

        }
      );


      primaryNav
        .querySelectorAll("a")
        .forEach(
          function (link) {

            link.addEventListener(
              "click",
              function () {

                if (
                  window.innerWidth <= 900
                ) {

                  primaryNav.classList.remove(
                    "open"
                  );


                  menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                  );

                }

              }
            );

          }
        );

    }


    /*
    =====================================================
    SMOOTH SCROLL
    =====================================================
    */

    document
      .querySelectorAll(
        'a[href^="#"]:not([href="#"])'
      )
      .forEach(
        function (link) {

          link.addEventListener(
            "click",
            function (event) {

              const target =
                document.querySelector(
                  link.getAttribute("href")
                );


              if (!target) {
                return;
              }


              event.preventDefault();


              target.scrollIntoView({
                behavior: "smooth",
                block: "start"
              });

            }
          );

        }
      );


    /*
    =====================================================
    DATE LIMITS
    =====================================================
    */

    const now =
      new Date();


    const todayString =
      now.getFullYear() +
      "-" +
      String(
        now.getMonth() + 1
      ).padStart(2, "0") +
      "-" +
      String(
        now.getDate()
      ).padStart(2, "0");


    document
      .querySelectorAll(
        'input[type="date"]'
      )
      .forEach(
        function (input) {

          input.min =
            todayString;

        }
      );


    /*
    =====================================================
    APPOINTMENT FORM
    =====================================================
    */

    const contactForm =
      document.getElementById(
        "contact-form"
      );


    if (!contactForm) {
      return;
    }


    const serviceType =
      document.getElementById(
        "service-type"
      );


    const streetAddress =
      document.getElementById(
        "street-address"
      );


    const formStatus =
      document.getElementById(
        "form-status"
      );


    const submitButton =
      document.getElementById(
        "submit-request"
      );


    const submissionIdField =
      document.getElementById(
        "submission-id"
      );


    const submissionTypeField =
      document.getElementById(
        "submission-type"
      );


    /*
    =====================================================
    CREATE SUBMISSION ID
    =====================================================
    */

    function createSubmissionId() {

      if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
          "function"
      ) {

        return crypto.randomUUID();

      }


      return (
        "RCW-" +
        Date.now() +
        "-" +
        Math.random()
          .toString(36)
          .slice(2, 8)
          .toUpperCase()
      );

    }


    let submissionId =
      sessionStorage.getItem(
        SUBMISSION_ID_KEY
      );


    if (!submissionId) {

      submissionId =
        createSubmissionId();


      sessionStorage.setItem(
        SUBMISSION_ID_KEY,
        submissionId
      );

    }


    let submissionType =
      sessionStorage.getItem(
        SUBMISSION_TYPE_KEY
      ) ||
      "New Request";


    if (submissionIdField) {

      submissionIdField.value =
        submissionId;

    }


    if (submissionTypeField) {

      submissionTypeField.value =
        submissionType;

    }


    /*
    =====================================================
    MOBILE ADDRESS REQUIREMENT
    =====================================================
    */

    function updateAddressRequirement() {

      if (
        !serviceType ||
        !streetAddress
      ) {
        return;
      }


      streetAddress.required =
        serviceType.value ===
        "Mobile Notary";

    }


    if (serviceType) {

      serviceType.addEventListener(
        "change",
        updateAddressRequirement
      );

    }


    /*
    =====================================================
    SAVE FORM DATA
    =====================================================
    */

    function saveForm() {

      const saved =
        {};


      const fields =
        contactForm.querySelectorAll(
          "input, select, textarea"
        );


      fields.forEach(
        function (field) {

          if (
            !field.name ||
            field.type === "hidden"
          ) {
            return;
          }


          if (
            field.type ===
            "checkbox"
          ) {

            saved[field.name] =
              field.checked;

          } else {

            saved[field.name] =
              field.value;

          }

        }
      );


      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(saved)
      );

    }


    /*
    =====================================================
    RESTORE FORM DATA
    =====================================================
    */

    function restoreForm() {

      const raw =
        sessionStorage.getItem(
          STORAGE_KEY
        );


      if (!raw) {
        return;
      }


      try {

        const saved =
          JSON.parse(raw);


        Object.keys(saved)
          .forEach(
            function (name) {

              const field =
                contactForm.elements[name];


              if (!field) {
                return;
              }


              if (
                field.type ===
                "checkbox"
              ) {

                field.checked =
                  Boolean(
                    saved[name]
                  );

              } else {

                field.value =
                  saved[name];

              }

            }
          );


      } catch (error) {

        console.error(
          "Could not restore appointment form:",
          error
        );

      }

    }


    contactForm.addEventListener(
      "input",
      saveForm
    );


    contactForm.addEventListener(
      "change",
      saveForm
    );


    restoreForm();

    updateAddressRequirement();


    /*
    =====================================================
    STATUS MESSAGE
    =====================================================
    */

    function setFormMessage(
      message,
      isError
    ) {

      if (!formStatus) {
        return;
      }


      formStatus.textContent =
        message;


      formStatus.style.fontWeight =
        "700";


      formStatus.style.color =
        isError
          ? "#a12b2b"
          : "#1f7a4d";

    }


    /*
    =====================================================
    PREPARE GOOGLE SHEETS PAYLOAD
    =====================================================
    */

    function buildSheetPayload(
      formData
    ) {

      const sheetData =
        new URLSearchParams();


      for (
        const [key, value]
        of formData.entries()
      ) {

        sheetData.append(
          key,
          value
        );

      }


      return sheetData;

    }


    /*
    =====================================================
    SEND GOOGLE SHEETS COPY IN BACKGROUND

    IMPORTANT:
    Google Sheets logging is secondary.

    Formspree is the primary customer intake system.
    Spreadsheet problems must never trap the customer
    on the appointment page.
    =====================================================
    */

    function sendToGoogleSheets(
      formData
    ) {

      const sheetData =
        buildSheetPayload(
          formData
        );


      /*
      -----------------------------------------------
      PREFERRED METHOD
      SEND BEACON
      -----------------------------------------------
      */

      if (
        navigator.sendBeacon
      ) {

        try {

          const sent =
            navigator.sendBeacon(
              GOOGLE_SHEETS_URL,
              sheetData
            );


          console.log(
            "Google Sheets beacon dispatched:",
            sent
          );


          return;

        } catch (beaconError) {

          console.error(
            "Google Sheets beacon failed:",
            beaconError
          );

        }

      }


      /*
      -----------------------------------------------
      FALLBACK METHOD
      FETCH WITH KEEPALIVE
      -----------------------------------------------
      */

      fetch(
        GOOGLE_SHEETS_URL,
        {

          method: "POST",

          mode: "no-cors",

          keepalive: true,

          headers: {

            "Content-Type":
              "application/x-www-form-urlencoded;charset=UTF-8"

          },

          body:
            sheetData.toString()

        }
      )
        .catch(
          function (sheetError) {

            console.error(
              "Google Sheets background logging failed:",
              sheetError
            );

          }
        );

    }


    /*
    =====================================================
    FORM SUBMISSION
    =====================================================
    */

    contactForm.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();


        updateAddressRequirement();

        saveForm();


        /*
        -----------------------------------------------
        VALIDATION
        -----------------------------------------------
        */

        if (
          !contactForm.checkValidity()
        ) {

          contactForm.reportValidity();

          return;

        }


        if (submissionIdField) {

          submissionIdField.value =
            submissionId;

        }


        if (submissionTypeField) {

          submissionTypeField.value =
            submissionType;

        }


        /*
        -----------------------------------------------
        BUTTON STATUS
        -----------------------------------------------
        */

        if (submitButton) {

          submitButton.disabled =
            true;


          submitButton.textContent =
            "Sending Request...";

        }


        setFormMessage(
          "Sending your appointment request...",
          false
        );


        try {

          const formData =
            new FormData(
              contactForm
            );


          /*
          =============================================
          PRIMARY SUBMISSION
          FORMSPREE
          =============================================
          */

          const formspreeResponse =
            await fetch(
              contactForm.action,
              {

                method: "POST",

                body:
                  formData,

                headers: {

                  "Accept":
                    "application/json"

                }

              }
            );


          if (
            !formspreeResponse.ok
          ) {

            throw new Error(
              "Your appointment request could not be submitted."
            );

          }


          /*
          =============================================
          FORMSPREE SUCCEEDED
          =============================================
          */


          /*
          Send spreadsheet copy without waiting.
          */

          sendToGoogleSheets(
            formData
          );


          /*
          Mark any later resubmission as an update.
          */

          sessionStorage.setItem(
            SUBMISSION_TYPE_KEY,
            "Updated Request"
          );


          setFormMessage(
            "Request received. Opening confirmation...",
            false
          );


          /*
          =============================================
          GO DIRECTLY TO THANK-YOU PAGE
          =============================================
          */

          window.location.assign(
            "thank-you.html"
          );


        } catch (error) {

          console.error(
            "Appointment request error:",
            error
          );


          setFormMessage(
            error.message ||
            "Your request could not be submitted.",
            true
          );


          if (submitButton) {

            submitButton.disabled =
              false;


            submitButton.textContent =
              "Submit Appointment Request";

          }

        }

      }
    );

  }
);
