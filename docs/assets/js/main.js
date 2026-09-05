/*
=========================================================
RCW SR. NOTARY SERVICES
FILE: assets/js/main.js

CHANGE NOTES
Version: 1.7.5
Date: September 5, 2026

Changes:
- Removed redundant second browser validity pass from the
  submit handler.
- Browser native validation now runs only once before the
  submit event.
- Preserved custom phone validation.
- Preserved appointment date/time validation.
- Preserved Florida mobile-service validation.
- Preserved Not Sure, Help Me Choose validation.
- Preserved stale NotarialHelpDescription cleanup.
- Preserved sessionStorage and review/resubmission workflow.
- Preserved Formspree submission.
- Preserved Google Sheets submission using the current
  deployed Apps Script URL.
- Added clearer submission-stage console logging.

GITHUB COMMIT:
Version 1.7.5 - Remove redundant submit validity pass
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
      "https://script.google.com/macros/s/AKfycbxhlpXIjnApIN3yPyl68TRk5eFCbDK2OtBVRaPUbcE-9D_F7CzFEgb6iNlE53BaukAz/exec";


    const STORAGE_KEY =
      "rcwAppointmentForm";


    const SUBMISSION_ID_KEY =
      "rcwSubmissionId";


    const SUBMISSION_TYPE_KEY =
      "rcwSubmissionType";


    const SUBMITTED_KEY =
      "rcwRequestAlreadySubmitted";


    const REVIEW_KEY =
      "rcwReviewExistingRequest";


    const STANDARD_TRAVEL_RADIUS =
      150;


    const GOOGLE_REQUEST_TIMEOUT_MS =
      5000;


    /*
    =====================================================
    DOCUMENT OPTIONS
    =====================================================
    */

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
    REQUEST SESSION FUNCTIONS
    =====================================================
    */

    function clearRequestSession() {

      sessionStorage.removeItem(
        STORAGE_KEY
      );


      sessionStorage.removeItem(
        SUBMISSION_ID_KEY
      );


      sessionStorage.removeItem(
        SUBMISSION_TYPE_KEY
      );


      sessionStorage.removeItem(
        SUBMITTED_KEY
      );


      sessionStorage.removeItem(
        REVIEW_KEY
      );

    }


    /*
    =====================================================
    PAGE NAVIGATION TYPE
    =====================================================
    */

    function getNavigationType() {

      const entries =
        performance.getEntriesByType(
          "navigation"
        );


      if (
        entries &&
        entries.length > 0
      ) {

        return entries[0].type;

      }


      return "navigate";

    }


    const navigationType =
      getNavigationType();


    /*
    =====================================================
    THANK-YOU PAGE BUTTON HANDLING
    =====================================================
    */

    document
      .querySelectorAll(
        "a, button"
      )
      .forEach(
        function (element) {

          const text =
            element.textContent
              .replace(
                /\s+/g,
                " "
              )
              .trim()
              .toLowerCase();


          /*
          -------------------------------------------------
          START NEW REQUEST
          -------------------------------------------------
          */

          if (
            text.includes(
              "start a new request"
            )
          ) {

            element.addEventListener(
              "click",
              function () {

                clearRequestSession();

              }
            );

          }


          /*
          -------------------------------------------------
          REVIEW OR CHANGE
          -------------------------------------------------
          */

          if (
            text.includes(
              "review or change"
            )
          ) {

            element.addEventListener(
              "click",
              function () {

                sessionStorage.setItem(
                  REVIEW_KEY,
                  "true"
                );


                sessionStorage.setItem(
                  SUBMITTED_KEY,
                  "true"
                );


                sessionStorage.setItem(
                  SUBMISSION_TYPE_KEY,
                  "Updated Request"
                );

              }
            );

          }

        }
      );


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


    /*
    =====================================================
    REFRESH BEHAVIOR

    RELOAD:
    Clear everything and create a new request.

    BACK/FORWARD:
    Preserve the request.

    REVIEW BUTTON:
    Preserve the request.
    =====================================================
    */

    const reviewExistingRequest =
      sessionStorage.getItem(
        REVIEW_KEY
      ) === "true";


    if (
      navigationType === "reload"
    ) {

      clearRequestSession();

    }


    /*
    =====================================================
    FORM ELEMENTS
    =====================================================
    */

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


    const notarialActType =
      document.getElementById(
        "notarial-act-type"
      );


    const documentType =
      document.getElementById(
        "document-type"
      );


    const notarialHelpGroup =
      document.getElementById(
        "notarial-help-group"
      );


    const notarialHelpDescription =
      document.getElementById(
        "notarial-help-description"
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
    TODAY
    =====================================================
    */

    function getTodayString() {

      const now =
        new Date();


      return (
        now.getFullYear() +
        "-" +
        String(
          now.getMonth() + 1
        )
          .padStart(
            2,
            "0"
          ) +
        "-" +
        String(
          now.getDate()
        )
          .padStart(
            2,
            "0"
          )
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


    /*
    =====================================================
    SUBMISSION TRACKING
    =====================================================
    */

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
      (
        alreadySubmitted ||
        reviewExistingRequest ||
        navigationType ===
          "back_forward"
      )
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
    FORM MESSAGE
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
    DOCUMENT TYPE WORKFLOW
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
        !DOCUMENT_OPTIONS[
          selectedAct
        ]
      ) {

        documentType.disabled =
          true;

        return;

      }


      DOCUMENT_OPTIONS[
        selectedAct
      ]
        .forEach(
          function (item) {

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

          }
        );


      documentType.disabled =
        false;


      if (
        restoreValue &&
        DOCUMENT_OPTIONS[
          selectedAct
        ].includes(
          restoreValue
        )
      ) {

        documentType.value =
          restoreValue;

      }

    }


    /*
    =====================================================
    HELP ME CHOOSE
    =====================================================
    */

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


      if (!needsHelp) {

        notarialHelpDescription.value =
          "";

      }


      if (needsHelp) {

        setFormMessage(
          "Tell me what you are trying to get notarized. I will contact you to help determine the appropriate service.",
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
    MOBILE ADDRESS
    =====================================================
    */

    function updateAddressRequirement() {

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
        String(
          value || ""
        )
          .replace(
            /\D/g,
            ""
          );


      if (
        digits.length === 11 &&
        digits.charAt(0) ===
        "1"
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
    DATE TIME
    =====================================================
    */

    function buildComparableDateTime(
      dateValue,
      timeValue
    ) {

      const d =
        dateValue.split("-");


      const t =
        timeValue.split(":");


      return new Date(

        Number(d[0]),

        Number(d[1]) - 1,

        Number(d[2]),

        Number(t[0]),

        Number(t[1]),

        0,

        0

      );

    }


    /*
    =====================================================
    DATE TIME VALIDATION
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
          alternate.getTime() <=
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
              field.type ===
                "hidden"
            ) {

              return;

            }


            if (
              field.name ===
                "notarialHelpDescription" &&
              notarialActType.value !==
                "Not Sure, Help Me Choose"
            ) {

              saved[field.name] =
                "";

              return;

            }


            saved[
              field.name
            ] =
              field.type ===
              "checkbox"
                ? field.checked
                : field.value;

          }
        );


      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          saved
        )
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
          JSON.parse(
            raw
          );


        if (
          saved.notarialActType
        ) {

          notarialActType.value =
            saved.notarialActType;


          populateDocumentTypes(
            saved.notarialActType,
            saved.documentType || ""
          );

        }


        Object.keys(
          saved
        )
          .forEach(
            function (name) {

              const field =
                contactForm.elements[
                  name
                ];


              if (!field) {

                return;

              }


              if (
                name ===
                  "notarialHelpDescription" &&
                saved.notarialActType !==
                  "Not Sure, Help Me Choose"
              ) {

                field.value =
                  "";

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

              } else if (
                name !==
                "documentType"
              ) {

                field.value =
                  saved[name];

              }

            }
          );


        updateNotarialHelpWorkflow();


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


    /*
    =====================================================
    RESTORE ONLY WHEN NOT REFRESHED
    =====================================================
    */

    if (
      navigationType !==
      "reload"
    ) {

      restoreForm();

    }


    updateAddressRequirement();


    /*
    =====================================================
    GOOGLE PAYLOAD
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
    GOOGLE SHEETS
    =====================================================
    */

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


        console.log(
          "RCW submit handler started."
        );


        /*
        -------------------------------------------------
        NORMALIZE STATE
        -------------------------------------------------
        */

        state.value =
          state.value
            .trim()
            .toUpperCase();


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
        UPDATE DYNAMIC REQUIREMENTS
        -------------------------------------------------
        */

        updateAddressRequirement();


        updateNotarialHelpWorkflow();


        /*
        -------------------------------------------------
        DATE VALIDATION
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
        HELP DESCRIPTION
        -------------------------------------------------
        */

        if (
          notarialActType.value ===
          "Not Sure, Help Me Choose" &&
          !notarialHelpDescription.value.trim()
        ) {

          setFormMessage(
            "Tell me what you are trying to get notarized so I can help determine the appropriate service.",
            true
          );


          notarialHelpDescription.focus();


          return;

        }


        /*
        -------------------------------------------------
        FINAL HELP-DESCRIPTION SANITIZATION
        -------------------------------------------------
        */

        if (
          notarialActType.value !==
          "Not Sure, Help Me Choose"
        ) {

          notarialHelpDescription.value =
            "";

        }


        /*
        -------------------------------------------------
        REQUEST TYPE
        -------------------------------------------------
        */

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


        /*
        -------------------------------------------------
        BUTTON
        -------------------------------------------------
        */

        submitButton.disabled =
          true;


        submitButton.textContent =
          "Sending Request...";


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
          GOOGLE SHEETS
          =================================================
          */

          setFormMessage(
            "Request received. Saving appointment...",
            false
          );


          await sendToGoogleSheets(
            formData
          );


          /*
          =================================================
          MARK REQUEST SUBMITTED
          =================================================
          */

          sessionStorage.setItem(
            SUBMITTED_KEY,
            "true"
          );


          sessionStorage.setItem(
            SUBMISSION_TYPE_KEY,
            "Updated Request"
          );


          sessionStorage.removeItem(
            REVIEW_KEY
          );


          /*
          =================================================
          THANK YOU
          =================================================
          */

          setFormMessage(
            "Request received. Opening confirmation...",
            false
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

  }
);
