"use strict";

document.addEventListener("DOMContentLoaded", async function () {
  const PRICING_FILE = "assets/data/pricing.json";

  let pricing = null;

  function money(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "$0.00";
    }

    return number.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function wholeMoney(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "$0";
    }

    return number.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  function numberValue(value, fallback = 0) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return number;
  }

  function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }

  async function loadPricing() {
    try {
      const response = await fetch(PRICING_FILE, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          "Pricing file could not be loaded. HTTP " +
          response.status
        );
      }

      pricing = await response.json();

      validatePricing();
      populatePricingPage();
      initializeCalculator();

    } catch (error) {
      console.error(
        "RCW pricing error:",
        error
      );

      showPricingError();
    }
  }

  function validatePricing() {
    const requiredFields = [
      "inPersonNotary",
      "ronNotary",
      "ronService",
      "mobileBase",
      "premiumGasBenchmark",
      "operatingAllowance",
      "vehicleMpg",
      "afterHours",
      "sameDay",
      "holiday",
      "waitingPer15Minutes",
      "automaticTravelRadius"
    ];

    requiredFields.forEach(function (field) {
      if (
        pricing[field] === undefined ||
        pricing[field] === null
      ) {
        throw new Error(
          "Missing pricing field: " + field
        );
      }
    });
  }

  function populatePricingPage() {
    const inPersonNotary =
      numberValue(pricing.inPersonNotary);

    const ronNotary =
      numberValue(pricing.ronNotary);

    const ronService =
      numberValue(pricing.ronService);

    const mobileBase =
      numberValue(pricing.mobileBase);

    const sameDay =
      numberValue(pricing.sameDay);

    const afterHours =
      numberValue(pricing.afterHours);

    const holiday =
      numberValue(pricing.holiday);

    const waiting =
      numberValue(pricing.waitingPer15Minutes);

    setText(
      "in-person-price",
      money(inPersonNotary)
    );

    setText(
      "ron-notary-price",
      money(ronNotary)
    );

    setText(
      "ron-service-price",
      money(ronService)
    );

    setText(
      "mobile-base-price",
      money(mobileBase)
    );

    setText(
      "mobile-base-summary",
      money(mobileBase)
    );

    setText(
      "same-day-price",
      money(sameDay)
    );

    setText(
      "after-hours-price",
      money(afterHours)
    );

    setText(
      "holiday-price",
      money(holiday)
    );

    setText(
      "waiting-price",
      money(waiting)
    );

    setText(
      "estimate-mobile-base",
      money(mobileBase)
    );

    setText(
      "estimate-notary",
      money(inPersonNotary)
    );

    setText(
      "ron-preview-notary",
      wholeMoney(ronNotary)
    );

    setText(
      "ron-preview-service",
      wholeMoney(ronService)
    );

    setText(
      "ron-preview-total",
      wholeMoney(
        ronNotary + ronService
      )
    );

    setText(
      "estimate-total",
      money(
        mobileBase + inPersonNotary
      )
    );
  }

  function calculateTravelCharge(oneWayMiles) {
    const miles =
      Math.max(
        0,
        numberValue(oneWayMiles)
      );

    const roundTripMiles =
      miles * 2;

    const mpg =
      Math.max(
        1,
        numberValue(
          pricing.vehicleMpg,
          25
        )
      );

    const premiumGas =
      Math.max(
        0,
        numberValue(
          pricing.premiumGasBenchmark
        )
      );

    const operatingAllowance =
      Math.max(
        0,
        numberValue(
          pricing.operatingAllowance
        )
      );

    const travelRate =
      premiumGas +
      operatingAllowance;

    const estimatedGallons =
      roundTripMiles / mpg;

    const rawTravelCharge =
      estimatedGallons *
      travelRate;

    const finalTravelCharge =
      Math.ceil(rawTravelCharge);

    return {
      oneWayMiles: miles,
      roundTripMiles: roundTripMiles,
      vehicleMpg: mpg,
      premiumGasBenchmark: premiumGas,
      operatingAllowance: operatingAllowance,
      travelRate: travelRate,
      estimatedGallons: estimatedGallons,
      rawTravelCharge: rawTravelCharge,
      finalTravelCharge: finalTravelCharge
    };
  }

  function getSchedulingFee(type) {
    switch (type) {
      case "same-day":
        return numberValue(
          pricing.sameDay
        );

      case "after-hours":
        return numberValue(
          pricing.afterHours
        );

      case "holiday":
        return numberValue(
          pricing.holiday
        );

      default:
        return 0;
    }
  }

  function calculateMobileEstimate() {
    if (!pricing) {
      return;
    }

    const milesInput =
      document.getElementById(
        "one-way-miles"
      );

    const actsInput =
      document.getElementById(
        "notarial-acts"
      );

    const appointmentType =
      document.getElementById(
        "appointment-type"
      );

    if (
      !milesInput ||
      !actsInput ||
      !appointmentType
    ) {
      return;
    }

    const oneWayMiles =
      Math.max(
        0,
        numberValue(
          milesInput.value
        )
      );

    const notarialActs =
      Math.max(
        1,
        Math.floor(
          numberValue(
            actsInput.value,
            1
          )
        )
      );

    actsInput.value =
      notarialActs;

    const travel =
      calculateTravelCharge(
        oneWayMiles
      );

    const mobileBase =
      numberValue(
        pricing.mobileBase
      );

    const notaryCharge =
      notarialActs *
      numberValue(
        pricing.inPersonNotary
      );

    const specialFee =
      getSchedulingFee(
        appointmentType.value
      );

    const total =
      mobileBase +
      travel.finalTravelCharge +
      notaryCharge +
      specialFee;

    setText(
      "estimate-mobile-base",
      money(mobileBase)
    );

    setText(
      "estimate-distance",
      formatMiles(
        travel.roundTripMiles
      )
    );

    setText(
      "estimate-travel",
      money(
        travel.finalTravelCharge
      )
    );

    setText(
      "estimate-notary",
      money(
        notaryCharge
      )
    );

    setText(
      "estimate-special",
      money(
        specialFee
      )
    );

    setText(
      "estimate-total",
      money(total)
    );

    checkTravelRadius(
      oneWayMiles
    );
  }

  function formatMiles(miles) {
    const value =
      numberValue(miles);

    if (
      Number.isInteger(value)
    ) {
      return value + " miles";
    }

    return (
      value.toFixed(1) +
      " miles"
    );
  }

  function checkTravelRadius(oneWayMiles) {
    const radius =
      numberValue(
        pricing.automaticTravelRadius,
        40
      );

    const existingMessage =
      document.getElementById(
        "travel-radius-message"
      );

    if (existingMessage) {
      existingMessage.remove();
    }

    if (
      oneWayMiles <= radius
    ) {
      return;
    }

    const calculatorButton =
      document.getElementById(
        "calculate-mobile"
      );

    if (!calculatorButton) {
      return;
    }

    const message =
      document.createElement("p");

    message.id =
      "travel-radius-message";

    message.className =
      "small-print";

    message.textContent =
      "This trip exceeds the standard " +
      radius +
      "-mile one-way service radius. Please request a custom travel quote.";

    calculatorButton.insertAdjacentElement(
      "afterend",
      message
    );
  }

  function initializeCalculator() {
    const calculatorButton =
      document.getElementById(
        "calculate-mobile"
      );

    if (!calculatorButton) {
      return;
    }

    calculatorButton.addEventListener(
      "click",
      calculateMobileEstimate
    );

    const milesInput =
      document.getElementById(
        "one-way-miles"
      );

    const actsInput =
      document.getElementById(
        "notarial-acts"
      );

    const appointmentType =
      document.getElementById(
        "appointment-type"
      );

    if (milesInput) {
      milesInput.addEventListener(
        "keydown",
        function (event) {
          if (event.key === "Enter") {
            calculateMobileEstimate();
          }
        }
      );
    }

    if (actsInput) {
      actsInput.addEventListener(
        "change",
        calculateMobileEstimate
      );
    }

    if (appointmentType) {
      appointmentType.addEventListener(
        "change",
        calculateMobileEstimate
      );
    }
  }

  function showPricingError() {
    const calculatorButton =
      document.getElementById(
        "calculate-mobile"
      );

    if (!calculatorButton) {
      return;
    }

    calculatorButton.disabled = true;

    calculatorButton.textContent =
      "Pricing Temporarily Unavailable";

    const message =
      document.createElement("p");

    message.className =
      "small-print";

    message.textContent =
      "Current pricing could not be loaded. Please request a quote before scheduling.";

    calculatorButton.insertAdjacentElement(
      "afterend",
      message
    );
  }

  loadPricing();
});
