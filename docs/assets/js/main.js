/*
=========================================================
RCW SR. NOTARY SERVICES
FILE: assets/js/main.js

CHANGE NOTES
Version: 1.7.1
Date: August 25, 2026

Changes:
- Fixed New Request vs Updated Request tracking.
- First successful submission is always New Request.
- Review or Change keeps the same SubmissionId and becomes Updated Request.
- Start a New Request clears old form/session data and creates a new SubmissionId.
- Preserved dependent Notarial Act and Document Type workflow.
- Preserved Not Sure, Help Me Choose workflow.
- Preserved Formspree integration.
- Preserved Google Sheets integration.
- Preserved phone formatting.
- Preserved date/time validation.
- Preserved Florida travel validation.
- Preserved 150-mile travel-radius logic.

GITHUB COMMIT:
Fix request tracking and management field defaults
=========================================================
*/

"use strict";

document.addEventListener("DOMContentLoaded", function () {

  const GOOGLE_SHEETS_URL =
    "https://script.google.com/macros/s/AKfycbyaOMyJdieQHb2JKX8jZduNBDh0HkQVpEaIirkfAXqVOkVL1Gf-Z0aCm8JpM4PUw-Ur/exec";

  const STORAGE_KEY = "rcwAppointmentForm";
  const SUBMISSION_ID_KEY = "rcwSubmissionId";
  const SUBMISSION_TYPE_KEY = "rcwSubmissionType";
  const SUBMITTED_KEY = "rcwRequestAlreadySubmitted";

  const STANDARD_TRAVEL_RADIUS = 150;
  const GOOGLE_REQUEST_TIMEOUT_MS = 5000;

  const DOCUMENT_OPTIONS = {

    "Acknowledgment": [
      "Power of Attorney",
      "Real Estate Document",
      "Vehicle Title or Bill of Sale",
      "Business Document",
      "Medical or Healthcare Document",
      "Agreement or Contract",
      "Other",
      "Not Sure"
    ],

    "Jurat": [
      "Affidavit",
      "Sworn Statement",
      "Court or Legal Document",
      "Business Document",
      "Declaration",
      "Other",
      "Not Sure"
    ],

    "Oath or Affirmation": [
      "Affidavit",
      "Sworn Statement",
      "Declaration",
      "Other",
      "Not Sure"
    ],

    "Copy Certification": [
      "Eligible Copy Certification",
      "Business Record",
      "Personal Record",
      "Other",
      "Not Sure"
    ],

    "Not Sure, Help Me Choose": [
      "Affidavit",
      "Power of Attorney",
      "Real Estate Document",
      "Vehicle Title or Bill of Sale",
      "Court or Legal Document",
      "Medical or Healthcare Document",
      "School or Minor Consent Form",
      "Business Document",
      "Agreement or Contract",
      "Sworn Statement",
      "Declaration",
      "Eligible Copy Certification",
      "Other",
      "Not Sure"
    ]

  };


  /*
  =====================================================
  YEAR
  =====================================================
  */

  const currentYear =
    document.getElementById("current-year");

  if (currentYear) {
    currentYear.textContent =
      new Date().getFullYear();
  }


  /*
  =====================================================
  THANK-YOU PAGE REQUEST BUTTONS
  =====================================================
  */

  function clearRequestSession() {

    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SUBMISSION_ID_KEY);
    sessionStorage.removeItem(SUBMISSION_TYPE_KEY);
    sessionStorage.removeItem(SUBMITTED_KEY);

  }


  document
    .querySelectorAll("a, button")
    .forEach(function (element) {

      const text =
        element.textContent
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();


      if (
        text.includes("start a new request")
      ) {

        element.addEventListener(
          "click",
          function () {

            clearRequestSession();

          }
        );

      }


      if (
        text.includes("review or change")
      ) {

        element.addEventListener(
          "click",
          function () {

            sessionStorage.setItem(
              SUBMISSION_TYPE_KEY,
              "Updated Request"
            );

            sessionStorage.setItem(
              SUBMITTED_KEY,
              "true"
            );

          }
        );

      }

    });


  /*
  =====================================================
  MOBILE NAVIGATION
  =====================================================
  */

  const menuToggle =
    document.querySelector(".menu-toggle");

  const primaryNav =
    document.querySelector(".primary-nav");


  if (
    menuToggle &&
    primaryNav
  ) {

    menuToggle.addEventListener(
      "click",
      function () {

        const isOpen =
          primaryNav.classList.toggle("open");

        menuToggle.setAttribute(
          "aria-expanded",
          isOpen ? "true" : "false"
        );

      }
    );

  }


  /*
  =====================================================
  CONTACT FORM
  =====================================================
  */

  const contactForm =
    document.getElementById("contact-form");

  if (!contactForm) {
    return;
  }


  const serviceType =
    document.getElementById("service-type");

  const streetAddress =
    document.getElementById("street-address");

  const state =
    document.getElementById("state");

  const phone =
    document.getElementById("phone");

  const preferredDate =
    document.getElementById("preferred-date");

  const preferredTime =
    document.getElementById("preferred-time");

  const alternateDate =
    document.getElementById("alternate-date");

  const alternateTime =
    document.getElementById("alternate-time");

  const notarialActType =
    document.getElementById("notarial-act-type");

  const documentType =
    document.getElementById("document-type");

  const notarialHelpGroup =
    document.getElementById("notarial-help-group");

  const notarialHelpDescription =
    document.getElementById("notarial-help-description");

  const formStatus =
    document.getElementById("form-status");

  const submitButton =
    document.getElementById("submit-request");

  const submissionIdField =
    document.getElementById("submission-id");

  const submissionTypeField =
    document.getElementById("submission-type");


  /*
  =====================================================
  TODAY
  =====================================================
  */

  function getTodayString() {

    const now =
      new Date();

    return (
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1)
        .padStart(2, "0") +
      "-" +
      String(now.getDate())
        .padStart(2, "0")
    );

  }


  const todayString =
    getTodayString();


  document
    .querySelectorAll(
      'input[type="date"]'
    )
    .forEach(function (input) {

      input.min =
        todayString;

    });


  /*
  =====================================================
  SUBMISSION TRACKING
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


  const alreadySubmitted =
    sessionStorage.getItem(
      SUBMITTED_KEY
    ) === "true";


  let submissionType =
    alreadySubmitted
      ? "Updated Request"
      : "New Request";


  sessionStorage.setItem(
    SUBMISSION_TYPE_KEY,
    submissionType
  );


  submissionIdField.value =
    submissionId;

  submissionTypeField.value =
    submissionType;


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
  NOTARIAL ACT / DOCUMENT TYPE
  =====================================================
  */

  function populateDocumentTypes(
    selectedAct,
    restoreValue
  ) {

    documentType.innerHTML =
      "";

    const starter =
      document.createElement(
        "option"
      );

    starter.value =
      "";

    starter.textContent =
      selectedAct
        ? "Select document type"
        : "Select a notarial act first";

    documentType.appendChild(
      starter
    );


    if (
      !selectedAct ||
      !DOCUMENT_OPTIONS[selectedAct]
    ) {

      documentType.disabled =
        true;

      return;

    }


    DOCUMENT_OPTIONS[
      selectedAct
    ].forEach(function (item) {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        item;

      option.textContent =
        item;

      documentType.appendChild(
        option
      );

    });


    documentType.disabled =
      false;


    if (
      restoreValue &&
      DOCUMENT_OPTIONS[
        selectedAct
      ].includes(restoreValue)
    ) {

      documentType.value =
        restoreValue;

    }

  }


  function updateNotarialHelpWorkflow() {

    const needsHelp =
      notarialActType.value ===
      "Not Sure, Help Me Choose";


    notarialHelpGroup.hidden =
      !needsHelp;

    notarialHelpDescription.required =
      needsHelp;

    documentType.required =
      !needsHelp;


    if (needsHelp) {

      setFormMessage(
        "Tell me what you are trying to get notarized and I will contact you to help determine the correct next step.",
        false
      );

    }

  }


  notarialActType.addEventListener(
    "change",
    function () {

      populateDocumentTypes(
        notarialActType.value,
        ""
      );

      updateNotarialHelpWorkflow();

      saveForm();

    }
  );


  /*
  =====================================================
  MOBILE SERVICE
  =====================================================
  */

  function updateAddressRequirement() {

    const isMobile =
      serviceType.value ===
      "Mobile Notary";

    streetAddress.required =
      isMobile;

  }


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

      }

    }
  );


  /*
  =====================================================
  PHONE
  =====================================================
  */

  function formatPhoneNumber(
    value
  ) {

    let digits =
      String(value || "")
        .replace(/\D/g, "");


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
      digits.substring(0, 3) +
      ") " +
      digits.substring(3, 6) +
      "-" +
      digits.substring(6, 10)
    );

  }


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


  /*
  =====================================================
  STATE
  =====================================================
  */

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


  /*
  =====================================================
  DATE/TIME VALIDATION
  =====================================================
  */

  function buildComparableDateTime(
    dateValue,
    timeValue
  ) {

    const dateParts =
      dateValue.split("-");

    const timeParts =
      timeValue.split(":");


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
        alternate.getTime() ===
        preferred.getTime()
      ) {

        setFormMessage(
          "Preferred and alternate appointment choices cannot be identical.",
          true
        );

        return false;

      }


      if (
        alternate.getTime() <
        preferred.getTime()
      ) {

        setFormMessage(
          "The alternate appointment must occur after the preferred appointment.",
          true
        );

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
      serviceType.value !==
      "Mobile Notary"
    ) {

      return true;

    }


    if (
      state.value
        .trim()
        .toUpperCase() !==
      "FL"
    ) {

      setFormMessage(
        "This location is outside Florida. Please select Remote Online Notary service or contact RCW Sr. Notary Services to discuss your options.",
        true
      );

      return false;

    }


    return true;

  }


  /*
  =====================================================
  FORM STORAGE
  =====================================================
  */

  function saveForm() {

    const saved =
      {};


    contactForm
      .querySelectorAll(
        "input, select, textarea"
      )
      .forEach(function (field) {

        if (
          !field.name ||
          field.type === "hidden"
        ) {
          return;
        }


        saved[field.name] =
          field.type === "checkbox"
            ? field.checked
            : field.value;

      });


    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(saved)
    );

  }


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


      if (
        saved.notarialActType
      ) {

        notarialActType.value =
          saved.notarialActType;

        populateDocumentTypes(
          saved.notarialActType,
          saved.documentType || ""
        );

        updateNotarialHelpWorkflow();

      }


      Object.keys(saved)
        .forEach(function (name) {

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
              Boolean(saved[name]);

          } else if (
            name !== "documentType"
          ) {

            field.value =
              saved[name];

          }

        });


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


  async function sendToGoogleSheets(
    formData
  ) {

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

          method: "POST",

          mode: "no-cors",

          cache: "no-store",

          redirect: "follow",

          headers: {

            "Content-Type":
              "application/x-www-form-urlencoded;charset=UTF-8"

          },

          body:
            buildGooglePayload(
              formData
            ),

          signal:
            controller.signal

        }
      );


      window.clearTimeout(
        timeoutId
      );


      console.log(
        "Google Sheets request dispatched."
      );


      return true;


    } catch (error) {

      window.clearTimeout(
        timeoutId
      );


      console.error(
        "Google Sheets submission failed:",
        error
      );


      return false;

    }

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


      state.value =
        state.value
          .trim()
          .toUpperCase();


      const formattedPhone =
        formatPhoneNumber(
          phone.value
        );


      if (!formattedPhone) {

        setFormMessage(
          "Enter a valid 10-digit U.S. phone number.",
          true
        );

        return;

      }


      phone.value =
        formattedPhone;


      updateAddressRequirement();

      updateNotarialHelpWorkflow();


      if (
        !contactForm.checkValidity()
      ) {

        contactForm.reportValidity();

        return;

      }


      if (
        !validateAppointmentTimes()
      ) {

        saveForm();

        return;

      }


      if (
        !validateTravelRequest()
      ) {

        saveForm();

        return;

      }


      submissionType =
        sessionStorage.getItem(
          SUBMITTED_KEY
        ) === "true"
          ? "Updated Request"
          : "New Request";


      submissionIdField.value =
        submissionId;

      submissionTypeField.value =
        submissionType;


      saveForm();


      submitButton.disabled =
        true;

      submitButton.textContent =
        "Sending Request...";


      try {

        const formData =
          new FormData(
            contactForm
          );


        console.log(
          "Sending appointment to Formspree..."
        );


        const formspreeResponse =
          await fetch(
            contactForm.action,
            {

              method: "POST",

              body: formData,

              headers: {

                "Accept":
                  "application/json"

              }

            }
          );


        if (!formspreeResponse.ok) {

          throw new Error(
            "Your appointment request could not be submitted."
          );

        }


        console.log(
          "Formspree submission successful."
        );


        await sendToGoogleSheets(
          formData
        );


        sessionStorage.setItem(
          SUBMITTED_KEY,
          "true"
        );


        sessionStorage.setItem(
          SUBMISSION_TYPE_KEY,
          "Updated Request"
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


        submitButton.disabled =
          false;

        submitButton.textContent =
          "Submit Appointment Request";

      }

    }
  );

});
