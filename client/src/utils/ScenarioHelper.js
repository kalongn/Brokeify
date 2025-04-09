// This file contains utility functions and constants for handling scenarios in the application.

export const stateMap = {
  "AL": "Alabama",
  "AK": "Alaska",
  "AZ": "Arizona",
  "AR": "Arkansas",
  "CA": "California",
  "CO": "Colorado",
  "CT": "Connecticut",
  "DE": "Delaware",
  "FL": "Florida",
  "GA": "Georgia",
  "HI": "Hawaii",
  "ID": "Idaho",
  "IL": "Illinois",
  "IN": "Indiana",
  "IA": "Iowa",
  "KS": "Kansas",
  "KY": "Kentucky",
  "LA": "Louisiana",
  "ME": "Maine",
  "MD": "Maryland",
  "MA": "Massachusetts",
  "MI": "Michigan",
  "MN": "Minnesota",
  "MS": "Mississippi",
  "MO": "Missouri",
  "MT": "Montana",
  "NE": "Nebraska",
  "NV": "Nevada",
  "NH": "New Hampshire",
  "NJ": "New Jersey",
  "NM": "New Mexico",
  "NY": "New York",
  "NC": "North Carolina",
  "ND": "North Dakota",
  "OH": "Ohio",
  "OK": "Oklahoma",
  "OR": "Oregon",
  "PA": "Pennsylvania",
  "RI": "Rhode Island",
  "SC": "South Carolina",
  "SD": "South Dakota",
  "TN": "Tennessee",
  "TX": "Texas",
  "UT": "Utah",
  "VT": "Vermont",
  "VA": "Virginia",
  "WA": "Washington",
  "WV": "West Virginia",
  "WI": "Wisconsin",
  "WY": "Wyoming"
};

export const validateRequired = (newErrors, field, value) => {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
    newErrors[field] = "This field is required";
  } else if (typeof value === "number" && value < 0) {
    newErrors[field] = "Value must be non-negative";
  }
  return newErrors;
}

export const validateDistribution = (newErrors, field, dist) => {
  // Check if a type of distribution has been selected
  const type = dist.type;
  if (type === null || type === undefined || type === "") {
    newErrors[field] = "This field is required";
    return;
  }
  let isPercentage = dist.isPercentage || false;
  switch (type) {
    case "fixed":
      if (dist.value === null || dist.value === undefined) {
        newErrors[field] = "This field is required";
      } else if (dist.value < 0) {
        newErrors[field] = "Value must be non-negative";
      } else if (isPercentage && dist.value > 100) {
        newErrors[field] = "Percentage must be between 0 and 100";
      }
      break;
    case "uniform":
      if ((dist.lowerBound === null || dist.upperBound === null) || (dist.lowerBound === undefined || dist.upperBound === undefined)) {
        newErrors[field] = "Both lower and upper bounds are required";
      } else if (dist.lowerBound < 0 || dist.upperBound < 0) {
        newErrors[field] = "Bounds must be non-negative";
      } else if (dist.lowerBound > dist.upperBound) {
        newErrors[field] = "Lower bound must be less than or equal to upper bound";
      } else if (isPercentage && (dist.lowerBound > 100 || dist.upperBound > 100)) {
        newErrors[field] = "Percentage must be between 0 and 100";
      }
      break;
    case "normal":
      if ((dist.mean === null || dist.standardDeviation === null) || (dist.mean === undefined || dist.standardDeviation === undefined)) {
        newErrors[field] = "Both mean and standard deviation are required";
      } else if (dist.mean < 0 || dist.standardDeviation < 0) {
        newErrors[field] = "Both mean and standard deviation must be non-negative";
      } else if (isPercentage && (dist.mean > 100 || dist.standardDeviation > 100)) {
        newErrors[field] = "Mean and standard deviation must be less than 100";
      }
      break;
    default:
      break;
  }
  return newErrors;
};