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
  const name = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
    newErrors[field] = `${name} field is required`;
  } else if (typeof value === "number" && value < 0) {
    newErrors[field] = `${name} value must be non-negative`;
  }
  return newErrors;
}

export const validateDistribution = (newErrors, field, dist, canNegative = false) => {
  console.log(canNegative);
  console.log("percentage", dist.isPercentage);
  // Check if a type of distribution has been selected
  const type = dist.type;
  const name = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
  if (type === null || type === undefined || type === "") {
    newErrors[field] = `${name} choice is required`;
    return;
  }
  let isPercentage = dist.isPercentage || false;
  switch (type) {
    case "fixed":
      if (dist.value === null || dist.value === undefined) {
        newErrors[field] = `${name} field is required`;
      } else if (dist.value < 0 && !canNegative) {
        newErrors[field] = `${name} value must be non-negative`;
      } else if (isPercentage) {
        if (!canNegative && (dist.value < 0 || dist.value > 100)) {
          newErrors[field] = `${name} percentage must be between 0 and 100`;
        } else if (canNegative && (dist.value < -100 || dist.value > 100)) {
          newErrors[field] = `${name} percentage must be between -100 and 100`;
        }
      }
      break;
    case "uniform":
      if ((dist.lowerBound === null || dist.upperBound === null) || (dist.lowerBound === undefined || dist.upperBound === undefined)) {
        newErrors[field] = `${name} lower and upper bounds are required`;
      } else if ((dist.lowerBound < 0 || dist.upperBound < 0) && !canNegative) {
        newErrors[field] = `${name} bounds must be non-negative`;
      } else if ((canNegative && dist.lowerBound > dist.upperBound) || (!canNegative && dist.lowerBound < 0)) {
        newErrors[field] = `${name} lower bound must be less than or equal to upper bound`;
      } else if (isPercentage) {
        if ((dist.lowerBound > 100 || dist.upperBound > 100)) {
          newErrors[field] = `${name} percentage must be between -100 and 100`;
        } else if ((dist.lowerBound < -100 || dist.upperBound < -100) && canNegative) {
          newErrors[field] = `${name} percentage must be between -100 and 100`;
        }
      }
      break;
    case "normal":
      if ((dist.mean === null || dist.standardDeviation === null) || (dist.mean === undefined || dist.standardDeviation === undefined)) {
        newErrors[field] = `${name} mean and standard deviation are required`;
      } else if ((dist.mean < 0 || dist.standardDeviation < 0) && !canNegative) {
        newErrors[field] = `${name} mean and standard deviation must be non-negative`;
      } else if (isPercentage) {
        if ((dist.mean > 100 || dist.standardDeviation > 100) && !canNegative) {
          newErrors[field] = `${name} mean and standard deviation must be between 0 and 100`;
        } else if ((dist.mean < -100 || dist.standardDeviation < -100) && canNegative) {
          newErrors[field] = `${name} mean and standard deviation must be between -100 and 100`;
        }
      }
      break;
    default:
      break;
  }
  return newErrors;
};

export const clearErrors = (setErrors, name) => {
  // Prompt to AI (Amazon Q): in highlighted code, instead of making it "", can i just delete the field name refers to?
  // Works as needed, only needing to re-prompt to disable eslint error and edit for "selectInput"
  if (name !== "selectInput") {
    setErrors(prev => {
      // eslint-disable-next-line no-unused-vars
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  } else {
    setErrors(prev => {
      // eslint-disable-next-line no-unused-vars
      const { state: _, ...rest } = prev;
      return rest;
    });
  }
}