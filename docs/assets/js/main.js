/*
=========================================================
RCW SR. NOTARY SERVICES
FILE: assets/js/main.js

CHANGE NOTES
Version: 1.6
Date: August 19, 2026

Changes:
- Added logical appointment date validation.
- Prevents appointment dates before today.
- Requires alternate date and alternate time together.
- Prevents alternate appointment from matching preferred appointment.
- Requires alternate appointment to occur after preferred appointment.
- Added Florida mobile-service validation.
- Mobile service outside Florida is redirected toward RON service.
- Florida mobile requests remain eligible for special consideration.
- Added 150-mile standard travel-radius messaging.
- Preserved customer form data when validation fails.
- Normalizes state abbreviations to uppercase.
- Normalizes phone entry before submission.
- Preserved sessionStorage review and resubmission workflow.
- Preserved Formspree submission.
- Preserved Google Sheets background logging.
- Preserved thank-you redirect.
- Preserved responsive navigation.

GITHUB COMMIT:
Add appointment validation and Florida travel service rules
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


    const STANDARD_TRAVEL_RADIUS =
      150;


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
    TODAY
    =====================================================
    */

    function getTodayString() {

      const now =
        new Date();


      const year =
        now.getFullYear();


      const month =
        String(
          now.getMonth() + 1
        ).padStart(
          2,
          "0"
        );


      const day =
        String(
          now.getDate()
        ).padStart(
          2,
          "0"
        );


      return (
        year +
        "-" +
        month +
        "-" +
        day
      );

    }


    const todayString =
      getTodayString();


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
    FORM
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


    const city =
      document.getElementById(
        "city"
      );


    const state =
      document.getElementById(
        "state"
      );


    const zipCode =
      document.getElementById(
        "zip-code"
      );


    const phone =
      document.getElementById(
        "phone"
      );


    const preferredDate =
      document.getElementById(
        "preferred-date"
      );


    const preferredTime =
      document.getElementById(
        "preferred-time"
      );


    const alternateDate =
      document.getElementById(
        "alternate-date"
      );


    const alternateTime =
      document.getElementById(
        "alternate-time"
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
    SUBMISSION ID
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
    FORM STATUS
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


      const isMobile =
        serviceType.value ===
        "Mobile Notary";


      streetAddress.required =
        isMobile;


      if (isMobile) {

        streetAddress.placeholder =
          "Required for mobile appointments";

      }

    }


    if (serviceType) {

      serviceType.addEventListener(
        "change",
        function () {

          updateAddressRequirement();


          if (
            serviceType.value ===
            "Mobile Notary"
          ) {

            setFormMessage(
              "Standard mobile service covers locations within " +
              STANDARD_TRAVEL_RADIUS +
              " driving miles of ZIP code 33594. Florida locations beyond that range may still receive special consideration.",
              false
            );

          } else {

            setFormMessage(
              "",
              false
            );

          }

        }
      );

    }


    /*
    =====================================================
    PHONE NORMALIZATION
    =====================================================
    */

    function formatPhoneNumber(
      value
    ) {

      if (!value) {
        return "";
      }


      let digits =
        String(value)
          .replace(
            /\D/g,
            ""
          );


      if (
        digits.length === 11 &&
        digits.charAt(0) === "1"
      ) {

        digits =
          digits.substring(1);

      }


      if (
        digits.length !== 10
      ) {

        return null;

      }


      return (
        "(" +
        digits.substring(
          0,
          3
        ) +
        ") " +
        digits.substring(
          3,
          6
        ) +
        "-" +
        digits.substring(
          6,
          10
        )
      );

    }


    if (phone) {

      phone.addEventListener(
        "blur",
        function () {

          const formatted =
            formatPhoneNumber(
              phone.value
            );


          if (formatted) {

            phone.value =
              formatted;

          }

        }
      );

    }


    /*
    =====================================================
    STATE NORMALIZATION
    =====================================================
    */

    if (state) {

      state.addEventListener(
        "blur",
        function () {

          state.value =
            state.value
              .trim()
              .toUpperCase();

        }
      );

    }


    /*
    =====================================================
    DATE/TIME COMPARISON
    =====================================================
    */

    function buildComparableDateTime(
      dateValue,
      timeValue
    ) {

      if (
        !dateValue ||
        !timeValue
      ) {

        return null;

      }


      const dateParts =
        dateValue.split("-");


      const timeParts =
        timeValue.split(":");


      if (
        dateParts.length !== 3 ||
        timeParts.length < 2
      ) {

        return null;

      }


      return new Date(
        Number(dateParts[0]),
        Number(dateParts[1]) - 1,
        Number(dateParts[2]),
        Number(timeParts[0]),
        Number(timeParts[1]),
        0,
        0
      );

    }


    /*
    =====================================================
    DATE/TIME VALIDATION
    =====================================================
    */

    function validateAppointmentTimes() {

      if (
        preferredDate.value <
        todayString
      ) {

        setFormMessage(
          "Preferred appointment date cannot be before today.",
          true
        );


        preferredDate.focus();

        return false;

      }


      const hasAlternateDate =
        Boolean(
          alternateDate.value
        );


      const hasAlternateTime =
        Boolean(
          alternateTime.value
        );


      if (
        hasAlternateDate !==
        hasAlternateTime
      ) {

        setFormMessage(
          "Enter both an alternate date and alternate time, or leave both blank.",
          true
        );


        if (!alternateDate.value) {

          alternateDate.focus();

        } else {

          alternateTime.focus();

        }


        return false;

      }


      if (
        hasAlternateDate &&
        alternateDate.value <
        todayString
      ) {

        setFormMessage(
          "Alternate appointment date cannot be before today.",
          true
        );


        alternateDate.focus();

        return false;

      }


      if (
        hasAlternateDate &&
        hasAlternateTime
      ) {

        const preferred =
          buildComparableDateTime(
            preferredDate.value,
            preferredTime.value
          );


        const alternate =
          buildComparableDateTime(
            alternateDate.value,
            alternateTime.value
          );


        if (
          preferred &&
          alternate &&
          alternate.getTime() ===
          preferred.getTime()
        ) {

          setFormMessage(
            "Preferred and alternate appointment choices cannot be identical.",
            true
          );


          alternateTime.focus();

          return false;

        }


        if (
          preferred &&
          alternate &&
          alternate.getTime() <
          preferred.getTime()
        ) {

          setFormMessage(
            "The alternate appointment must occur after the preferred appointment.",
            true
          );


          alternateDate.focus();

          return false;

        }

      }


      return true;

    }


    /*
    =====================================================
    TRAVEL VALIDATION
    =====================================================
    */

    function validateTravelRequest() {

      if (
        !serviceType ||
        serviceType.value !==
        "Mobile Notary"
      ) {

        return true;

      }


      const stateValue =
        state.value
          .trim()
          .toUpperCase();


      if (
        stateValue !== "FL"
      ) {

        setFormMessage(
          "This location is outside Florida and outside RCW Sr. Notary Services' travel area. Please select Remote Online Notary service, or contact RCW Sr. Notary Services if you have questions about your options.",
          true
        );


        serviceType.focus();

        return false;

      }


      /*
      Florida requests are allowed.

      Apps Script calculates actual driving mileage.

      Locations over 150 miles are flagged for
      special consideration instead of rejected.
      */

      return true;

    }


    /*
    =====================================================
    SAVE FORM
    =====================================================
    */

    function saveForm() {

      const saved =
        {};


      contactForm
        .querySelectorAll(
          "input, select, textarea"
        )
        .forEach(
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
    RESTORE FORM
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
    GOOGLE SHEETS
    =====================================================
    */

    function sendToGoogleSheets(
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
          function (error) {

            console.error(
              "Google Sheets logging failed:",
              error
            );

          }
        );

    }


    /*
    =====================================================
    SUBMIT
    =====================================================
    */

    contactForm.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();


        updateAddressRequirement();


        if (state) {

          state.value =
            state.value
              .trim()
              .toUpperCase();

        }


        /*
        -------------------------------------------------
        PHONE
        -------------------------------------------------
        */

        const formattedPhone =
          formatPhoneNumber(
            phone.value
          );


        if (!formattedPhone) {

          setFormMessage(
            "Enter a valid 10-digit U.S. phone number.",
            true
          );


          phone.focus();

          return;

        }


        phone.value =
          formattedPhone;


        /*
        -------------------------------------------------
        BROWSER VALIDATION
        -------------------------------------------------
        */

        if (
          !contactForm.checkValidity()
        ) {

          contactForm.reportValidity();

          return;

        }


        /*
        -------------------------------------------------
        APPOINTMENT VALIDATION
        -------------------------------------------------
        */

        if (
          !validateAppointmentTimes()
        ) {

          saveForm();

          return;

        }


        /*
        -------------------------------------------------
        TRAVEL VALIDATION
        -------------------------------------------------
        */

        if (
          !validateTravelRequest()
        ) {

          saveForm();

          return;

        }


        saveForm();


        if (submissionIdField) {

          submissionIdField.value =
            submissionId;

        }


        if (submissionTypeField) {

          submissionTypeField.value =
            submissionType;

        }


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
          -------------------------------------------------
          FORMSPREE
          -------------------------------------------------
          */

          const response =
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


          if (!response.ok) {

            throw new Error(
              "Your appointment request could not be submitted."
            );

          }


          /*
          -------------------------------------------------
          GOOGLE SHEETS
          -------------------------------------------------
          */

          sendToGoogleSheets(
            formData
          );


          /*
          -------------------------------------------------
          MARK RESUBMISSION AS UPDATE
          -------------------------------------------------
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
          -------------------------------------------------
          THANK YOU
          -------------------------------------------------
          */

          window.location.assign(
            "thank-you.html"
          );


        } catch (error) {

          console.error(
            "Appointment submission error:",
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
