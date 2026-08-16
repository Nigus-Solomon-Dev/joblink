const mongoose = require('mongoose');

const siteSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Setting key is required'],
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

siteSettingSchema.index({ key: 1 }, { unique: true });

siteSettingSchema.statics.getSettings = async function () {
  const docs = await this.find().lean();
  const map = {};
  docs.forEach((doc) => {
    map[doc.key] = doc.value;
  });
  return map;
};

siteSettingSchema.statics.setSetting = async function (key, value) {
  return this.findOneAndUpdate(
    { key },
    { $set: { value } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
};

module.exports = mongoose.model('SiteSetting', siteSettingSchema);