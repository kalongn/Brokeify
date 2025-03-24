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

export const distributionToString = (distribution) => {
    switch (distribution.distributionType) {
        case "FIXED_AMOUNT":
            return `${distribution.value}`;
        case "FIXED_PERCENTAGE":
            return `${distribution.value * 100}%`;
        case "UNIFORM_AMOUNT":
            return `[${distribution.lowerBound}, ${distribution.upperBound}]`;
        case "UNIFORM_PERCENTAGE":
            return `[${distribution.lowerBound * 100}%, ${distribution.upperBound * 100}%]`;
        case "NORMAL_AMOUNT":
            return `μ: ${distribution.mean}, σ: ${distribution.standardDeviation}`;
        case "NORMAL_PERCENTAGE":
            return `μ: ${distribution.mean * 100}%, σ: ${distribution.standardDeviation * 100}%`;
        default:
            return "Unknown Distribution Type";
    }
};