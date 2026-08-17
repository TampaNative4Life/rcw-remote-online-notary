"use strict";

document.addEventListener("DOMContentLoaded", function () {

  /*
    --------------------------------------------------
    RCW SR. NOTARY SERVICES
    MAIN SITE JAVASCRIPT

    Appointment workflow:

    1. Customer submits website form
    2. Formspree receives submission
    3. Formspree sends email notification
    4. Google Apps Script receives same submission
    5. Google Sheet receives new appointment row
    6. Customer goes to thank-you.html
    --------------------------------------------------
  */

  const GOOGLE_SHEETS_URL =
    "https://script.google.com/macros/s/AKfycbyaOMyJdieQHb2JKX8jZduNBDh0HkQVpEaIirkfAXqVOkVL1Gf-Z0aCm8JpM4PUw-Ur/exec";


  /*
    --------------------------------------------------
    CURRENT YEAR
    --------------------------------------------------
  */

  const currentYear =
    document.getElementById("current-year");

  if (currentYear) {
    currentYear.textContent =
      new Date().getFullYear();
  }


  /*
    --------------------------------------------------
    MOBILE NAVIGATION
    --------------------------------------------------
  */

  const menuToggle =
    document.querySelector(".menu-toggle");

  const primaryNav =
    document.querySelector(".primary-nav");


  if (menuToggle && primaryNav) {

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


    primaryNav
      .querySelectorAll("a")
      .forEach(function (link) {

        link.addEventListener(
          "click",
          function () {

            if (window.innerWidth <= 900) {

              primaryNav.classList.remove("open");

              menuToggle.setAttribute(
                "aria-expanded",
                "false"
              );
            }
          }
        );
      });


    document.addEventListener(
      "click",
      function (event) {

        const clickedInsideNav =
          primaryNav.contains(event.target);

        const clickedMenuButton =
          menuToggle.contains(event.target);

        if (
          window.innerWidth <= 900 &&
          primaryNav.classList.contains("open") &&
          !clickedInsideNav &&
          !clickedMenuButton
        ) {

          primaryNav.classList.remove("open");

          menuToggle.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      }
    );


    window.addEventListener(
      "resize",
      function () {

        if (window.innerWidth > 900) {

          primaryNav.classList.remove("open");

          menuToggle.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      }
    );
  }


  /*
    --------------------------------------------------
    SMOOTH INTERNAL LINKS
    --------------------------------------------------
  */

  const internalLinks =
    document.querySelectorAll(
      'a[href^="#"]:not([href="#"])'
    );


  internalLinks.forEach(function (link) {

    link.addEventListener(
      "click",
      function (event) {

        const targetId =
          link.getAttribute("href");

        const target =
          document.querySelector(targetId);

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
  });


  /*
    --------------------------------------------------
    PREVENT PAST APPOINTMENT DATES
    --------------------------------------------------
  */

  const dateInputs =
    document.querySelectorAll(
      'input[type="date"]'
    );


  if (dateInputs.length > 0) {

    const today =
      new Date();

    const year =
      today.getFullYear();

    const month =
      String(
        today.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        today.getDate()
      ).padStart(2, "0");

    const todayString =
      `${year}-${month}-${day}`;


    dateInputs.forEach(function (input) {

      input.min =
        todayString;
    });
  }


  /*
    --------------------------------------------------
    APPOINTMENT FORM
    --------------------------------------------------
  */

  const contactForm =
    document.getElementById(
      "contact-form"
    );

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


  /*
    --------------------------------------------------
    MOBILE ADDRESS REQUIREMENT
    --------------------------------------------------
  */

  function updateAddressRequirement() {

    if (
      !serviceType ||
      !streetAddress
    ) {
      return;
    }


    if (
      serviceType.value ===
      "Mobile Notary"
    ) {

      streetAddress.required =
        true;

      streetAddress.placeholder =
        "Required for mobile appointments";

    } else {

      streetAddress.required =
        false;

      streetAddress.placeholder =
        "Required for mobile appointments";
    }
  }


  if (
    serviceType &&
    streetAddress
  ) {

    serviceType.addEventListener(
      "change",
      updateAddressRequirement
    );

    updateAddressRequirement();
  }


  /*
    --------------------------------------------------
    FORM STATUS MESSAGE
    --------------------------------------------------
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
    --------------------------------------------------
    SEND TO GOOGLE SHEETS
    --------------------------------------------------
  */

  async function sendToGoogleSheets(
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


    /*
      no-cors is intentional.

      Google Apps Script web apps can redirect
      responses through Google infrastructure.

      We only need to send the appointment data.
      The spreadsheet script performs the row insert.
    */

    await fetch(
      GOOGLE_SHEETS_URL,
      {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body:
          sheetData.toString()
      }
    );
  }


  /*
    --------------------------------------------------
    FORM SUBMISSION
    --------------------------------------------------
  */

  if (contactForm) {

    contactForm.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();


        /*
          Recheck conditional requirements.
        */

        updateAddressRequirement();


        /*
          Browser validation.
        */

        if (!contactForm.checkValidity()) {

          contactForm.reportValidity();

          return;
        }


        /*
          Extra mobile-address check.
        */

        if (
          serviceType &&
          serviceType.value ===
            "Mobile Notary" &&
          streetAddress &&
          !streetAddress.value.trim()
        ) {

          streetAddress.focus();

          streetAddress.reportValidity();

          return;
        }


        /*
          Lock button while processing.
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

          /*
            Capture the form once.

            The same information goes to
            Formspree and Google Sheets.
          */

          const formData =
            new FormData(
              contactForm
            );


          /*
            ------------------------------------------
            STEP 1
            SEND TO FORMSPREE
            ------------------------------------------
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


          /*
            Formspree must succeed before we
            consider the appointment submitted.
          */

          if (!formspreeResponse.ok) {

            let errorMessage =
              "Your appointment request could not be submitted. Please check your information and try again.";


            if (
              formspreeResponse.status ===
              429
            ) {

              errorMessage =
                "Too many requests were submitted in a short period. Please wait a few minutes and try again.";
            }


            try {

              const errorData =
                await formspreeResponse.json();


              if (
                errorData &&
                Array.isArray(
                  errorData.errors
                ) &&
                errorData.errors.length > 0
              ) {

                errorMessage =
                  errorData.errors
                    .map(
                      function (error) {

                        return error.message;
                      }
                    )
                    .join(" ");
              }

            } catch (jsonError) {

              console.error(
                "Could not read Formspree error response:",
                jsonError
              );
            }


            throw new Error(
              errorMessage
            );
          }


          /*
            ------------------------------------------
            STEP 2
            SEND SAME REQUEST TO GOOGLE SHEETS
            ------------------------------------------
          */

          try {

            await sendToGoogleSheets(
              formData
            );

          } catch (sheetError) {

            /*
              Do NOT tell the customer their
              appointment failed.

              Formspree already received it,
              so the business still has the request.

              Log spreadsheet failure separately.
            */

            console.error(
              "Google Sheets logging error:",
              sheetError
            );
          }


          /*
            ------------------------------------------
            STEP 3
            SUCCESS
            ------------------------------------------
          */

          contactForm.reset();


          setFormMessage(
            "Request received. Opening confirmation...",
            false
          );


          /*
            Small delay gives the browser time
            to dispatch the spreadsheet request.
          */

          window.setTimeout(
            function () {

              window.location.href =
                "thank-you.html";

            },
            400
          );


        } catch (error) {

          console.error(
            "Appointment request error:",
            error
          );


          setFormMessage(
            error.message ||
            "Your request could not be submitted. Please try again.",
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

});
