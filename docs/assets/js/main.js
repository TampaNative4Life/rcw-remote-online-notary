/*
=========================================================
RCW SR. NOTARY SERVICES
FILE: assets/js/main.js

CHANGE NOTES
Version: 1.6.2
Date: August 25, 2026

Changes:
- Removed navigator.sendBeacon for Google Sheets submissions.
- Google Apps Script POST is now sent with fetch().
- Website waits for the Google Sheets POST attempt before redirecting.
- Added Google Sheets request timeout protection.
- Added detailed Console logging for Formspree and Google Sheets.
- Spreadsheet failure does not cancel a successful Formspree request.
- Customer still reaches thank-you page if spreadsheet logging fails.
- Preserved appointment form session storage.
- Preserved Review or Change My Request workflow.
- Preserved New Request and Updated Request tracking.
- Preserved phone normalization as (XXX) XXX-XXXX.
- Preserved preferred and alternate appointment validation.
- Preserved 150-mile Florida mobile travel rules.
- Preserved out-of-state mobile service guidance.
- Preserved Formspree as primary appointment intake.
- Preserved responsive navigation.

GITHUB COMMIT:
Replace beacon with reliable Google Sheets appointment submission
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


    const GOOGLE_REQUEST_TIMEOUT_MS =
      5000;


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
    CONTACT FORM
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


    const state =
      document.getElementById(
        "state"
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
    PHONE FORMAT
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

            saveForm();

          }

        }
      );

    }


    /*
    =====================================================
    STATE FORMAT
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


          saveForm();

        }
      );

    }


    /*
    =====================================================
    DATE TIME BUILDER
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
    APPOINTMENT VALIDATION
    =====================================================
    */

    function validateAppointmentTimes() {

      if (
        !preferredDate.value ||
        !preferredTime.value
      ) {

        setFormMessage(
          "Preferred appointment date and time are required.",
          true
        );


        return false;

      }


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


        if (
          !alternateDate.value
        ) {

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
          "This location is outside Florida and outside RCW Sr. Notary Services' standard travel area. Please select Remote Online Notary service, or contact RCW Sr. Notary Services to discuss your options.",
          true
        );


        serviceType.focus();

        return false;

      }


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
    GOOGLE SHEETS PAYLOAD
    =====================================================
    */

    function buildGooglePayload(
      formData
    ) {

      const params =
        new URLSearchParams();


      for (
        const [key, value]
        of formData.entries()
      ) {

        params.append(
          key,
          value
        );

      }


      return params.toString();

    }


    /*
    =====================================================
    GOOGLE SHEETS POST

    We intentionally use no-cors because Google Apps
    Script does not provide a normal CORS response.

    The Promise resolving means the browser completed
    the POST dispatch.

    Apps Script itself remains responsible for
    processing and validating the request.
    =====================================================
    */

    async function sendToGoogleSheets(
      formData
    ) {

      const payload =
        buildGooglePayload(
          formData
        );


      const controller =
        new AbortController();


      const timeoutId =
        window.setTimeout(
          function () {

            controller.abort();

          },
          GOOGLE_REQUEST_TIMEOUT_MS
        );


      try {

        console.log(
          "Sending appointment to Google Sheets..."
        );


        await fetch(
          GOOGLE_SHEETS_URL,
          {

            method:
              "POST",

            mode:
              "no-cors",

            cache:
              "no-store",

            redirect:
              "follow",

            headers: {

              "Content-Type":
                "application/x-www-form-urlencoded;charset=UTF-8"

            },

            body:
              payload,

            signal:
              controller.signal

          }
        );


        window.clearTimeout(
          timeoutId
        );


        console.log(
          "Google Sheets request dispatched successfully."
        );


        return true;


      } catch (error) {

        window.clearTimeout(
          timeoutId
        );


        if (
          error.name ===
          "AbortError"
        ) {

          console.error(
            "Google Sheets request timed out."
          );

        } else {

          console.error(
            "Google Sheets submission failed:",
            error
          );

        }


        return false;

      }

    }


    /*
    =====================================================
    FORM SUBMIT
    =====================================================
    */

    contactForm.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();


        updateAddressRequirement();


        /*
        -------------------------------------------------
        NORMALIZE STATE
        -------------------------------------------------
        */

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
        HTML VALIDATION
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


        /*
        -------------------------------------------------
        SAVE CURRENT FORM
        -------------------------------------------------
        */

        saveForm();


        if (
          submissionIdField
        ) {

          submissionIdField.value =
            submissionId;

        }


        if (
          submissionTypeField
        ) {

          submissionTypeField.value =
            submissionType;

        }


        /*
        -------------------------------------------------
        BUTTON
        -------------------------------------------------
        */

        if (
          submitButton
        ) {

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
          =================================================
          STEP 1
          FORMSPREE
          =================================================
          */

          console.log(
            "Sending appointment to Formspree..."
          );


          const formspreeResponse =
            await fetch(
              contactForm.action,
              {

                method:
                  "POST",

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


          console.log(
            "Formspree submission successful."
          );


          /*
          =================================================
          STEP 2
          GOOGLE SHEETS
          =================================================
          */


          setFormMessage(
            "Request received. Saving appointment...",
            false
          );


          const sheetSuccess =
            await sendToGoogleSheets(
              formData
            );


          if (
            sheetSuccess
          ) {

            console.log(
              "Google Sheets logging completed."
            );

          } else {

            console.warn(
              "Appointment reached Formspree, but Google Sheets logging did not complete."
            );

          }


          /*
          =================================================
          STEP 3
          MARK FUTURE RESUBMISSION
          =================================================
          */

          sessionStorage.setItem(
            SUBMISSION_TYPE_KEY,
            "Updated Request"
          );


          /*
          =================================================
          STEP 4
          THANK-YOU
          =================================================
          */

          setFormMessage(
            "Request received. Opening confirmation...",
            false
          );


          console.log(
            "Opening thank-you page."
          );


          window.location.href =
            "thank-you.html";


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


          if (
            submitButton
          ) {

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
