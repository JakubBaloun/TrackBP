import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: String,
      enum: ["polar"],
      required: true,
    },
    externalId: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      default: function () {
        return this.detailedSport || this.sport || "Activity";
      },
    },
    description: {
      type: String,
      default: "",
    },
    feeling: {
      type: Number,
      default: -1,
    },

    sport: { type: String },
    detailedSport: { type: String },
    startTime: { type: Date, required: true },
    timezoneOffset: { type: Number },
    duration: { type: Number, required: true },

    stats: {
      calories: Number,
      distance: Number,
      avgHeartRate: Number,
      maxHeartRate: Number,
      fatPercentage: Number,
      carbohydratePercentage: Number,
      proteinPercentage: Number,
    },

    load: {
      value: Number,
      interpretation: String,
    },

    // --- HIDDEN DATA ---

    samples: {
      heartRate: { type: [Number], select: false },
      speed: { type: [Number], select: false },
      cadence: { type: [Number], select: false },
    },

    zones: {
      type: [
        {
          index: Number,
          lowerLimit: Number,
          upperLimit: Number,
          duration: Number,
        },
      ],
      select: false,
    },

    route: {
      type: {
        type: String,
        enum: ["LineString"],
        default: "LineString",
      },
      coordinates: {
        type: [[Number]],
        select: false,
      },
    },

    originalData: {
      type: mongoose.Schema.Types.Mixed,
      select: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

activitySchema.index({ provider: 1, externalId: 1 }, { unique: true });
activitySchema.index({ userId: 1, startTime: -1 });

export default mongoose.model("Activity", activitySchema);
