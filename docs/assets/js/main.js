"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const primaryNav = document.querySelector(".primary-nav");
  const currentYear = document.getElementById("current-year");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", function () {
      const isOpen = primaryNav.classList.toggle("open");

      menuToggle.setAttribute(
        "aria-expanded",
        isOpen ? "true" : "false"
      );
    });

    primaryNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth <= 900) {
          primaryNav.classList.remove("open");
          menuToggle.setAttribute("aria-expanded", "false");
        }
      });
    });

    document.addEventListener("click", function (event) {
      const clickedInsideNav = primaryNav.contains(event.target);
      const clickedMenuButton = menuToggle.contains(event.target);

      if (
        window.innerWidth <= 900 &&
        primaryNav.classList.contains("open") &&
        !clickedInsideNav &&
        !clickedMenuButton
      ) {
        primaryNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) {
        primaryNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const internalLinks = document.querySelectorAll(
    'a[href^="#"]:not([href="#"])'
  );

  internalLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);

      if (!target) {
        return;
      }

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });

  const dateInputs = document.querySelectorAll('input[type="date"]');

  if (dateInputs.length > 0) {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const todayString = `${year}-${month}-${day}`;

    dateInputs.forEach(function (input) {
      input.min = todayString;
    });
  }

  const contactForm = document.getElementById("contact-form");
  const serviceType = document.getElementById("service-type");
  const streetAddress = document.getElementById("street-address");

  if (serviceType && streetAddress) {
    function updateAddressRequirement() {
      if (serviceType.value === "mobile") {
        streetAddress.required = true;
        streetAddress.placeholder = "Required for mobile appointments";
      } else {
        streetAddress.required = false;
        streetAddress.placeholder = "Required for mobile appointments";
      }
    }

    serviceType.addEventListener(
      "change",
      updateAddressRequirement
    );

    updateAddressRequirement();
  }

  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      alert(
        "The appointment form is not connected to email delivery yet. Your information has not been sent."
      );
    });
  }
});
