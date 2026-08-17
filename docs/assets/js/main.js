"use strict";

document.addEventListener("DOMContentLoaded", function () {

  const menuToggle =
    document.querySelector(".menu-toggle");

  const primaryNav =
    document.querySelector(".primary-nav")

  const currentYear =
    document.getElementById("current-year");

  if (currentYear) {
    currentYear.textContent =
      new Date().getFullYear();
  }

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

      streetAddress.required = true;

      streetAddress.placeholder =
        "Required for mobile appointments";

    } else {

      streetAddress.required = false;

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


  if (contactForm) {

    contactForm.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();


        if (!contactForm.checkValidity()) {

          contactForm.reportValidity();

          return;
        }


        updateAddressRequirement();


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


          const response =
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


          if (response.ok) {

            contactForm.reset();

            window.location.href =
              "thank-you.html";

            return;
          }


          let message =
            "Your request could not be submitted. Please check your information and try again.";


          if (response.status === 429) {

            message =
              "Too many requests were submitted in a short period. Please wait a few minutes and try again.";
          }


          try {

            const data =
              await response.json();

            if (
              data &&
              Array.isArray(
                data.errors
              ) &&
              data.errors.length > 0
            ) {

              message =
                data.errors
                  .map(function (error) {
                    return error.message;
                  })
                  .join(" ");
            }

          } catch (jsonError) {

            console.error(
              "Could not read Formspree error response:",
              jsonError
            );
          }


          throw new Error(message);


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
