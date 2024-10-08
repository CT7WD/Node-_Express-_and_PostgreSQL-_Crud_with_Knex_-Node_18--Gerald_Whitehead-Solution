const restaurantsService = require("./restaurants.service.js");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

const VALID_PROPERTIES = ["supplier_name",
  "restaurant_name",
  "cuisine",
  "address",
];


// VALIDATE THAT REQUEST BODY ONLY CONTAINS REQUIRE PROPERTIES.
function hasOnlyValidProperties(req, res, next) {
  const { data = {} } = req.body;

  const invalidFields = Object.keys(data).filter( (field) => !VALID_PROPERTIES.includes(field) );

  if (invalidFields.length) {
    return next({
      status: 400,
      message: `Invalid field(s): ${invalidFields.join(", ")} `,

    });
  }
  next();
}

// VALIDATES THE EACH PROPERTY HAS A VALUE.
function hasProperties(...properties) {
    return function(req, res, next) {
        const { data = {} } = req.body;

        try {
            properties.forEach((property) => {
                if (!data[property]) {
                    const error = new Error(`A '${property}' property is required.`);
                    error.status = 400;
                    throw error;
                }
            });
            next();
        } catch (error) {
            next(error);
        }
    };
}

async function restaurantExists(req, res, next) {
  const { restaurantId } = req.params;

  const restaurant = await restaurantsService.read(restaurantId);

  if (restaurant) {
    res.locals.restaurant = restaurant;
    return next();
  }
  next({ status: 404, message: `Restaurant cannot be found.` });
}

async function list(req, res, next) {
  const data = await restaurantsService.list();
  res.json({ data });
}

async function create(req, res, next) {
  // Your solution here
  restaurantsService
      .create(req.body.data)
      .then((data) => res.status(201).json({data}))
      .catch(next);
  
}

async function update(req, res, next) {
  const updatedRestaurant = {
    ...res.locals.restaurant,
    ...req.body.data,
    restaurant_id: res.locals.restaurant.restaurant_id,
  };

  const data = await restaurantsService.update(updatedRestaurant);

  res.json({ data });
}

async function destroy(req, res, next) {
  // your solution here
  restaurantsService
      .delete(res.locals.restaurant.restaurant_id)
      .then(() => res.sendStatus(204))
      .catch(next);
//   res.json({ data: {} });
}

module.exports = {
  list: asyncErrorBoundary(list),
  create: [hasOnlyValidProperties,
    hasProperties("restaurant_name", "cuisine", "address"),
    asyncErrorBoundary(create)],
  update: [asyncErrorBoundary(restaurantExists), asyncErrorBoundary(update)],
  delete: [asyncErrorBoundary(restaurantExists), asyncErrorBoundary(destroy)],
};
