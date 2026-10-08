const Listing = require("../models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

//Index
module.exports.index = async (req, res) => {
  let allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.searchListing = async (req, res) => {
  let country = req.query.country?.trim();
  if (!country) {
    req.flash("error", "Sorry,No listing for this country");
    return res.redirect("/listings");
  }

  let allListings = await Listing.find({
    country: { $regex: country, $options: "i" },
  });

  if (allListings.length === 0) {
    req.flash("error", `Sorry, No listing found for ${country}`);
    return res.redirect("/listings");
  }

  res.render("listings/index.ejs", { allListings, searchQuery: country });
};

//Show listings
module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exists!");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

//Create listing
module.exports.createListing = async (req, res, next) => {
  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  let url = req.file.path;
  let filename = req.file.filename;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  newListing.geometry = response.body.features[0].geometry;

  let savedListing = await newListing.save();
  console.log(savedListing);
  req.flash("success", "New Listing Added!");
  res.redirect("/listings");
};

//Edit listing
module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exists!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  let transformedImageUrl = originalImageUrl.replace(
    "/upload",
    "/upload/c_fit,h_300,w_250",
  );

  res.render("listings/edit.ejs", { listing, transformedImageUrl });
};

//Update listing
module.exports.updateListing = async (req, res, next) => {
  if (!req.body.listing) {
    next(new ExpressError(400, "send valid listing"));
  }
  const { id } = req.params;
  const updatedListing = req.body.listing;
  let listing = await Listing.findByIdAndUpdate(id, updatedListing);

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }
  req.flash("success", " Listing Updated!");
  res.redirect(`/listings/${id}`);
};

//Delete listing
module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", " Listing Deleted!");
  res.redirect("/listings");
};
