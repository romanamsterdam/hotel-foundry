export const COVERAGE = {
  frontOffice: { dayPosts: 1, nightPosts: 1, hoursDay: 16, hoursNight: 8 },
  security: { nightOnly: true, nightPosts: 1 },
};

export const CAPACITIES = {
  fbService: { coversPerServerPerHour: 12 },     // diners a server can handle per hour
  bar: { coversPerBartenderPerHour: 25 },
  kitchen: { coversPerChefPerHour: 20 },         // prep+pass combined
  housekeeping: { roomsPerAttendantPerShift: 15, shiftHours: 8 },
  spa: { treatmentsPerTherapistPerHour: 1 },     // if treatment hours known
};

export const SERVICE_PERIODS = {
  breakfast: { defaultHours: 3, defaultCovers: 40 },
  lunch: { defaultHours: 4, defaultCovers: 25 },
  dinner: { defaultHours: 5, defaultCovers: 35 },
  bar: { defaultHours: 8, defaultCovers: 60 }
};

export const DEPARTMENT_LABELS = {
  frontOffice: "Front Office",
  housekeeping: "Housekeeping", 
  fbService: "F&B Service",
  kitchen: "Kitchen",
  bar: "Bar",
  wellness: "Wellness/Spa",
  maintenance: "Maintenance",
  security: "Security",
  admin: "Admin"
};