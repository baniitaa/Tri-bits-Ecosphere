import mongoose from "mongoose";

const { Schema } = mongoose;

const departmentSchema = new Schema(
  {
    departmentName: {
      type: String,
      required: [true, "Department name is required."],
      unique: true,
      trim: true,
      minlength: [2, "Department name must be at least 2 characters long."],
      maxlength: [100, "Department name cannot exceed 100 characters."],
    },

    departmentCode: {
      type: String,
      required: [true, "Department code is required."],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [2, "Department code must be at least 2 characters long."],
      maxlength: [20, "Department code cannot exceed 20 characters."],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters."],
      default: "",
    },

    // Placeholder reference - User model will be added by another team member
    manager: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address.",
      ],
    },

    phone: {
      type: String,
      trim: true,
      match: [/^[0-9+\-\s()]{7,20}$/, "Please provide a valid phone number."],
    },

    totalEmployees: {
      type: Number,
      default: 0,
      min: [0, "Total employees cannot be negative."],
    },

    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "INACTIVE"],
        message: "{VALUE} is not a valid department status.",
      },
      default: "ACTIVE",
    },

    // Placeholder references
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
departmentSchema.index({ departmentName: 1 });
departmentSchema.index({ departmentCode: 1 });
departmentSchema.index({ status: 1 });

// Prevent duplicate key errors caused by whitespace/case
departmentSchema.pre("save", function (next) {
  if (this.departmentName) {
    this.departmentName = this.departmentName.trim();
  }

  if (this.departmentCode) {
    this.departmentCode = this.departmentCode.trim().toUpperCase();
  }

  if (this.email) {
    this.email = this.email.trim().toLowerCase();
  }

  next();
});

const Department = mongoose.model("Department", departmentSchema);

export default Department;