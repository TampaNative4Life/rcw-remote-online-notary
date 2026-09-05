{
  "_changeNotes": {
    "file": "pricing.json",
    "version": "1.1",
    "date": "September 5, 2026",
    "changes": [
      "Prepared pricing configuration for backend quote calculations.",
      "Preserved existing notary, RON, mobile, urgency, waiting, fuel, and operating rates.",
      "Added travel origin ZIP 33594.",
      "Added round-trip multiplier for mobile travel calculations.",
      "Added whole-dollar ceiling rule for calculated travel charges.",
      "Added 150-mile standard travel radius used by the appointment system.",
      "Preserved the existing 40-mile automatic travel radius."
    ],
    "githubCommit": "Version 1.1 - Prepare pricing data for backend quote calculations"
  },

  "effectiveDate": "2026-08-17",
  "lastUpdated": "2026-09-05",

  "inPersonNotary": 10.00,
  "ronNotary": 25.00,
  "ronService": 22.00,
  "mobileBase": 40.00,

  "premiumGasBenchmark": 4.15,
  "operatingAllowance": 1.00,
  "vehicleMpg": 25,

  "travelOriginZip": "33594",
  "roundTripMultiplier": 2,
  "travelRounding": "ceilWholeDollar",

  "sameDay": 20.00,
  "afterHours": 25.00,
  "holiday": 35.00,
  "waitingPer15Minutes": 15.00,

  "automaticTravelRadius": 40,
  "standardTravelRadius": 150
}
