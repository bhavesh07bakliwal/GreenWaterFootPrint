const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const User = require('./models/users.js');
const Land = require('./models/land.js');
const Crop = require('./models/crop.js');
const Gwf = require('./models/gwf.js');
const ejsMate = require('ejs-mate');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);

// Connecting to mongoDB
const MONGO_URL = 'mongodb://127.0.0.1:27017/greenwaterfootprint';
main()
  .then(() => {
    console.log('connected to DB.');
  })
  .catch(err => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

// Register route
app.get('/', (req, res) => {
  res.render('registration.ejs');
});

// Login Route
app.get('/login', (req, res) => {
  res.render('login.ejs', { message: '' });
});

// Create Route DB
app.post('/login', async (req, res) => {
  const { name, email, password, number, taluka, role } = req.body;

  const user = new User({
    // name: name.split(' ').join('').toLowerCase(),
    name: name,
    email: email,
    password: password,
    number: number,
    taluka: taluka,
    role: role,
  });

  await user.save();

  res.render('login.ejs', {
    user: name,
    message: 'data saved successfully',
  });
});

let curUser;

// Home Route DB
app.post('/home', async (req, res) => {
  const { username, password, role } = req.body;

  const user = await User.findOne({ name: username });
  if (user) {
    curUser = user._id;
  }

  await User.findOneAndUpdate(
    { name: username },
    {
      role: role,
    }
  );

  const allUsers = await User.find({});
  const allLands = await Land.find({});
  const allCrops = await Crop.find({});
  const allGwfs = await Gwf.find({});

  if (!user) {
    res.render('login.ejs', { message: 'user does not exist' });
  } else {
    if (username === user.name && password === user.password) {
      const id = user._id.toString();
      const lands = await Land.find({ userId: id });
      const crops = await Crop.find({ userId: id });
      const gwfs = await Gwf.find({ userId: id });
      res.render('home.ejs', { user, lands, crops, gwfs, role, allUsers, allLands, allCrops, allGwfs });
    } else {
      res.render('login.ejs', { message: 'incorrect credentials' });
    }
  }
});

// Home Route
app.get('/home/:id', async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  const allUsers = await User.find({});
  const role = user.role;
  const allLands = await Land.find({});
  const allCrops = await Crop.find({});
  const allGwfs = await Gwf.find({});

  const lands = await Land.find({ userId: id });
  const crops = await Crop.find({ userId: id });
  const gwfs = await Gwf.find({ userId: id });

  res.render('home.ejs', { user, lands, crops, gwfs, role, allUsers, allLands, allCrops, allGwfs });
});

// Delete User
app.delete('/user/:id', async (req, res) => {
  const { id } = req.params;
  await Land.findOneAndDelete({ userId: id });
  await Crop.findOneAndDelete({ userId: id });
  await Gwf.findOneAndDelete({ userId: id });
  await User.findByIdAndDelete(id);
  res.redirect(`/home/${curUser}`);
});

// Delete Route DB
app.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  await Land.findOneAndDelete({ userId: id });
  await Crop.findOneAndDelete({ userId: id });
  await Gwf.findOneAndDelete({ userId: id });

  await User.findByIdAndDelete(id);

  res.redirect('/');
});

// Update Route DB
app.put('/update/:id', async (req, res) => {
  const { name: newName, email: newEmail, number: newPhone, taluka: newTaluka } = req.body;

  const { id } = req.params;
  const user = await User.findById(id);
  const role = user.role;
  const allUsers = await User.find({});
  const allLands = await Land.find({});
  const allCrops = await Crop.find({});
  const allGwfs = await Gwf.find({});

  const lands = await Land.find({ userId: id });
  const crops = await Crop.find({ userId: id });
  const gwfs = await Gwf.find({ userId: id });

  User.findByIdAndUpdate(
    id,
    {
      name: newName,
      email: newEmail,
      number: newPhone,
      taluka: newTaluka,
    },
    { runValidators: true, new: true }
  ).then(res => {
    console.log(res);
  });

  res.render('home.ejs', { user, lands, crops, gwfs, role, allUsers, allLands, allCrops, allGwfs });
});

// Update Password Route DB
app.put('/update/password/:id', async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const { id } = req.params;
  const user = await User.findById(id);
  const role = user.role;

  const lands = await Land.find({ userId: id });
  const crops = await Crop.find({ userId: id });
  const gwfs = await Gwf.find({ userId: id });
  const allUsers = await User.find({});
  const allLands = await Land.find({});
  const allCrops = await Crop.find({});
  const allGwfs = await Gwf.find({});

  if (oldPassword === user.password) {
    User.findByIdAndUpdate(
      id,
      {
        password: newPassword,
      },
      { runValidators: true, new: true }
    ).then(res => {
      console.log(res);
    });

    res.render('home.ejs', { user, lands, crops, gwfs, role, allUsers, allLands, allCrops, allGwfs });
  } else {
    res.send('Incorrect password');
  }
});

// Middlewares for inserting data :
const insertLand = async (req, res, next) => {
  const { landSize, taluka, soilName } = req.body;
  const { id } = req.params;

  const lands = await Land.find({ userId: id });

  if (lands.length > 0) {
    await Land.findOneAndUpdate(
      { userId: id },
      {
        landSize: landSize,
        taluka: taluka,
        soilName: soilName,
      }
    );
  } else {
    let newLand = new Land({
      landSize: landSize,
      taluka: taluka,
      soilName: soilName,
      userId: id,
    });

    const savedData = await newLand.save();
  }

  next();
};

const insertCrop = async (req, res, next) => {
  const { cropName, cropYield, growingSeason } = req.body;
  const { id } = req.params;

  const crops = await Crop.find({ userId: id });

  if (crops.length > 0) {
    await Crop.findOneAndUpdate(
      { userId: id },
      {
        cropName: cropName,
        cropYield: cropYield,
        growingSeason: growingSeason,
      }
    );
  } else {
    let newCrop = new Crop({
      userId: id,
      cropName: cropName,
      cropYield: cropYield,
      growingSeason: growingSeason,
    });

    const savedData = await newCrop.save();
  }

  next();
};

// Land Route
app.get('/calculate/:id', async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  res.render('landsoil.ejs', { user });
});

// Crop Route
app.get('/calculate/cropdetails/:id', async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  res.render('cropdetails.ejs', { user });
});

// Crop Route DB
app.post('/calculate/cropdetails/:id', insertLand, async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  res.render('cropdetails.ejs', { user });
});

// GWF Route
app.get('/calculate/gwfcalculation/:id', async (req, res) => {
  const { id } = req.params;

  const result = '';
  const user = await User.findById(id);

  res.render('gwfcalculation.ejs', { user, result });
});

// GWF Route DB
app.post('/calculate/gwfcalculation/:id', insertCrop, async (req, res) => {
  const { id } = req.params;

  const result = '';
  const user = await User.findById(id);
  res.render('gwfcalculation.ejs', { user, result });
});

let GWF;
// GWF Result Route DB
app.post('/calculate/gwfcalculation/result/:id', async (req, res) => {
  const { irrigationMethod, plantingDate, expectedYield } = req.body;
  const { id } = req.params;

  const gwfs = await Gwf.find({ userId: id });

  if (gwfs.length > 0) {
    await Gwf.findOneAndUpdate(
      { userId: id },
      {
        irrigationMethod: irrigationMethod,
        plantingDate: plantingDate,
        expectedYield: expectedYield,
      }
    );
  } else {
    let newGwf = new Gwf({
      userId: id,
      irrigationMethod: irrigationMethod,
      plantingDate: plantingDate,
      expectedYield: expectedYield,
    });

    const savedData = await newGwf.save();
  }

  const landDetails = await Land.findOne({ userId: id });
  const cropDetails = await Crop.findOne({ userId: id });
  const gwfDetails = await Gwf.findOne({ userId: id });
  const yield = Number(cropDetails.cropYield);
  const landSize = Number(landDetails.landSize);

  // ----------------------------
  // GWF Calculation Part

  if (landDetails.taluka == 'ambegaon') {
    // Step-1) Calculating CWR -> CWR = ETc * number of days per season :
    let CWR;
    if (cropDetails.cropName == 'jowar') {
      CWR = 4.06 * 153;
    } else if (cropDetails.cropName == 'bajra') {
      CWR = 3.67 * 153;
    } else if (cropDetails.cropName == 'cotton') {
      CWR = 4.06 * 153;
    } else if (cropDetails.cropName == 'sugarcane') {
      CWR = 3.41 * 120;bn  
    } else if (cropDetails.cropName == 'rice') {
      CWR = 5.17 * 153;
    } else if (cropDetails.cropName == 'maize') {
      CWR = 3.8 * 153;
    } else if (cropDetails.cropName == 'g roundnut') {
      CWR = 3.54 * 153;
    } else if (cropDetails.cropName == 'soybean') {
      CWR = 3.87 * 153;
    } else if (cropDetails.cropName == 'wheat') {
      CWR = 3.11 * 120;
    } else if (cropDetails.cropName == 'onion') {
      CWR = 5.56 * 92;
    }

    // -------------------------------------

    // Step-2) Calculating Total ER per Season :
    let ER;

    if (cropDetails.growingSeason == 'kharif') {
      ER = 741.99;
    } else if (cropDetails.growingSeason == 'rabi') {
      ER = 70.89;
    } else if (cropDetails.growingSeason == 'zaid') {
      ER = 19.05;
    }

    // Step-3) Calculating EF per Season :
    let EF;

    if (gwfDetails.irrigationMethod == 'drip') {
      EF = 0.9;
    } else if (gwfDetails.irrigationMethod == 'sprinkler') {
      EF = 0.8;
    } else if (gwfDetails.irrigationMethod == 'furrow') {
      EF = 0.7;
    }

    // Step-4) Calculating GWU :
    const min = function (value1, value2) {
      if (value1 < value2) return value1;
      else return value2;
    };

    const GWU = min(CWR, ER) * EF;

    // Step-5) Calculating Final GWF :
    GWF = (GWU / yield) * landSize;
  }

  if (landDetails.taluka == 'baramati') {
    // Step-1) Calculating CWR -> CWR = ETc * number of days per season :
    let CWR;
    if (cropDetails.cropName == 'jowar') {
      CWR = 3.88 * 153;
    } else if (cropDetails.cropName == 'bajra') {
      CWR = 3.75 * 153;
    } else if (cropDetails.cropName == 'cotton') {
      CWR = 4.15 * 153;
    } else if (cropDetails.cropName == 'sugarcane') {
      CWR = 3.5 * 120;
    } else if (cropDetails.cropName == 'rice') {
      CWR = 5.29 * 153;
    } else if (cropDetails.cropName == 'maize') {
      CWR = 3.88 * 153;
    } else if (cropDetails.cropName == 'groundnut') {
      CWR = 3.61 * 153;
    } else if (cropDetails.cropName == 'soybean') {
      CWR = 3.95 * 153;
    } else if (cropDetails.cropName == 'wheat') {
      CWR = 3.19 * 120;
    } else if (cropDetails.cropName == 'onion') {
      CWR = 5.66 * 92;
    }

    // -------------------------------------

    // Step-2) Calculating Total ER per Season :
    let ER;

    if (cropDetails.growingSeason == 'kharif') {
      ER = 622.38;
    } else if (cropDetails.growingSeason == 'rabi') {
      ER = 51.79;
    } else if (cropDetails.growingSeason == 'zaid') {
      ER = 20.29;
    }

    // Step-3) Calculating EF per Season :
    let EF;

    if (gwfDetails.irrigationMethod == 'drip') {
      EF = 0.9;
    } else if (gwfDetails.irrigationMethod == 'sprinkler') {
      EF = 0.8;
    } else if (gwfDetails.irrigationMethod == 'furrow') {
      EF = 0.7;
    }

    // Step-4) Calculating GWU :
    const min = function (value1, value2) {
      if (value1 < value2) return value1;
      else return value2;
    };

    const GWU = min(CWR, ER) * EF;

    // Step-5) Calculating Final GWF :
    GWF = (GWU / yield) * landSize;
  }

  if (landDetails.taluka == 'bhor') {
    // Step-1) Calculating CWR -> CWR = ETc * number of days per season :
    let CWR;
    if (cropDetails.cropName == 'jowar') {
      CWR = 3.74 * 153;
    } else if (cropDetails.cropName == 'bajra') {
      CWR = 3.61 * 153;
    } else if (cropDetails.cropName == 'cotton') {
      CWR = 4.0 * 153;
    } else if (cropDetails.cropName == 'sugarcane') {
      CWR = 3.42 * 120;
    } else if (cropDetails.cropName == 'rice') {
      CWR = 5.09 * 153;
    } else if (cropDetails.cropName == 'maize') {
      CWR = 3.74 * 153;
    } else if (cropDetails.cropName == 'groundnut') {
      CWR = 3.47 * 153;
    } else if (cropDetails.cropName == 'soybean') {
      CWR = 3.8 * 153;
    } else if (cropDetails.cropName == 'wheat') {
      CWR = 3.12 * 120;
    } else if (cropDetails.cropName == 'onion') {
      CWR = 5.54 * 92;
    }

    // -------------------------------------

    // Step-2) Calculating Total ER per Season :
    let ER;

    if (cropDetails.growingSeason == 'kharif') {
      ER = 622.38;
    } else if (cropDetails.growingSeason == 'rabi') {
      ER = 51.79;
    } else if (cropDetails.growingSeason == 'zaid') {
      ER = 20.29;
    }

    // Step-3) Calculating EF per Season :
    let EF;

    if (gwfDetails.irrigationMethod == 'drip') {
      EF = 0.9;
    } else if (gwfDetails.irrigationMethod == 'sprinkler') {
      EF = 0.8;
    } else if (gwfDetails.irrigationMethod == 'furrow') {
      EF = 0.7;
    }

    // Step-4) Calculating GWU :
    const min = function (value1, value2) {
      if (value1 < value2) return value1;
      else return value2;
    };

    const GWU = min(CWR, ER) * EF;

    // Step-5) Calculating Final GWF :
    GWF = (GWU / yield) * landSize;
  }

  if (landDetails.taluka == 'daund') {
    // Step-1) Calculating CWR -> CWR = ETc * number of days per season :
    let CWR;
    if (cropDetails.cropName == 'jowar') {
      CWR = 3.95 * 153;
    } else if (cropDetails.cropName == 'bajra') {
      CWR = 3.82 * 153;
    } else if (cropDetails.cropName == 'cotton') {
      CWR = 4.22 * 153;
    } else if (cropDetails.cropName == 'sugarcane') {
      CWR = 3.51 * 120;
    } else if (cropDetails.cropName == 'rice') {
      CWR = 5.39 * 153;
    } else if (cropDetails.cropName == 'maize') {
      CWR = 3.95 * 153;
    } else if (cropDetails.cropName == 'groundnut') {
      CWR = 3.67 * 153;
    } else if (cropDetails.cropName == 'soybean') {
      CWR = 4.02 * 153;
    } else if (cropDetails.cropName == 'wheat') {
      CWR = 3.19 * 120;
    } else if (cropDetails.cropName == 'onion') {
      CWR = 5.66 * 92;
    }

    // -------------------------------------

    // Step-2) Calculating Total ER per Season :
    let ER;

    if (cropDetails.growingSeason == 'kharif') {
      ER = 640;
    } else if (cropDetails.growingSeason == 'rabi') {
      ER = 24;
    } else if (cropDetails.growingSeason == 'zaid') {
      ER = 64;
    }

    // Step-3) Calculating EF per Season :
    let EF;

    if (gwfDetails.irrigationMethod == 'drip') {
      EF = 0.9;
    } else if (gwfDetails.irrigationMethod == 'sprinkler') {
      EF = 0.8;
    } else if (gwfDetails.irrigationMethod == 'furrow') {
      EF = 0.7;
    }

    // Step-4) Calculating GWU :
    const min = function (value1, value2) {
      if (value1 < value2) return value1;
      else return value2;
    };

    const GWU = min(CWR, ER) * EF;

    // Step-5) Calculating Final GWF :
    GWF = (GWU / yield) * landSize;
  }

  if (landDetails.taluka == 'haveli') {
    // Step-1) Calculating CWR -> CWR = ETc * number of days per season :
    let CWR;
    if (cropDetails.cropName == 'jowar') {
      CWR = 3.88 * 153;
    } else if (cropDetails.cropName == 'bajra') {
      CWR = 3.75 * 153;
    } else if (cropDetails.cropName == 'cotton') {
      CWR = 4.15 * 153;
    } else if (cropDetails.cropName == 'sugarcane') {
      CWR = 3.49 * 120;
    } else if (cropDetails.cropName == 'rice') {
      CWR = 5.29 * 153;
    } else if (cropDetails.cropName == 'maize') {
      CWR = 3.88 * 153;
    } else if (cropDetails.cropName == 'groundnut') {
      CWR = 3.62 * 153;
    } else if (cropDetails.cropName == 'soybean') {
      CWR = 3.95 * 153;
    } else if (cropDetails.cropName == 'wheat') {
      CWR = 3.18 * 120;
    } else if (cropDetails.cropName == 'onion') {
      CWR = 5.63 * 92;
    }

    // -------------------------------------

    // Step-2) Calculating Total ER per Season :
    let ER;

    if (cropDetails.growingSeason == 'kharif') {
      ER = 737;
    } else if (cropDetails.growingSeason == 'rabi') {
      ER = 16;
    } else if (cropDetails.growingSeason == 'zaid') {
      ER = 26;
    }

    // Step-3) Calculating EF per Season :
    let EF;

    if (gwfDetails.irrigationMethod == 'drip') {
      EF = 0.9;
    } else if (gwfDetails.irrigationMethod == 'sprinkler') {
      EF = 0.8;
    } else if (gwfDetails.irrigationMethod == 'furrow') {
      EF = 0.7;
    }

    // Step-4) Calculating GWU :
    const min = function (value1, value2) {
      if (value1 < value2) return value1;
      else return value2;
    };

    const GWU = min(CWR, ER) * EF;

    // Step-5) Calculating Final GWF :
    GWF = (GWU / yield) * landSize;
  }

  if (landDetails.taluka == 'indapur') {
    // Step-1) Calculating CWR -> CWR = ETc * number of days per season :
    let CWR;
    if (cropDetails.cropName == 'jowar') {
      CWR = 3.95 * 153;
    } else if (cropDetails.cropName == 'bajra') {
      CWR = 3.81 * 153;
    } else if (cropDetails.cropName == 'cotton') {
      CWR = 4.22 * 153;
    } else if (cropDetails.cropName == 'sugarcane') {
      CWR = 3.54 * 120;
    } else if (cropDetails.cropName == 'rice') {
      CWR = 5.39 * 153;
    } else if (cropDetails.cropName == 'maize') {
      CWR = 3.95 * 153;
    } else if (cropDetails.cropName == 'groundnut') {
      CWR = 3.68 * 153;
    } else if (cropDetails.cropName == 'soybean') {
      CWR = 4.02 * 153;
    } else if (cropDetails.cropName == 'wheat') {
      CWR = 3.22 * 120;
    } else if (cropDetails.cropName == 'onion') {
      CWR = 5.73 * 92;
    }

    // -------------------------------------

    // Step-2) Calculating Total ER per Season :
    let ER;

    if (cropDetails.growingSeason == 'kharif') {
      ER = 737;
    } else if (cropDetails.growingSeason == 'rabi') {
      ER = 16;
    } else if (cropDetails.growingSeason == 'zaid') {
      ER = 26;
    }

    // Step-3) Calculating EF per Season :
    let EF;

    if (gwfDetails.irrigationMethod == 'drip') {
      EF = 0.9;
    } else if (gwfDetails.irrigationMethod == 'sprinkler') {
      EF = 0.8;
    } else if (gwfDetails.irrigationMethod == 'furrow') {
      EF = 0.7;
    }

    // Step-4) Calculating GWU :
    const min = function (value1, value2) {
      if (value1 < value2) return value1;
      else return value2;
    };

    const GWU = min(CWR, ER) * EF;

    // Step-5) Calculating Final GWF :
    GWF = (GWU / yield) * landSize;
  }

  if (landDetails.taluka == 'junnar') {
    // Step-1) Calculating CWR -> CWR = ETc * number of days per season :
    let CWR;
    if (cropDetails.cropName == 'jowar') {
      CWR = 3.85 * 153;
    } else if (cropDetails.cropName == 'bajra') {
      CWR = 3.71 * 153;
    } else if (cropDetails.cropName == 'cotton') {
      CWR = 4.11 * 153;
    } else if (cropDetails.cropName == 'sugarcane') {
      CWR = 3.4 * 120;
    } else if (cropDetails.cropName == 'rice') {
      CWR = 5.23 * 153;
    } else if (cropDetails.cropName == 'maize') {
      CWR = 3.85 * 153;
    } else if (cropDetails.cropName == 'groundnut') {
      CWR = 3.57 * 153;
    } else if (cropDetails.cropName == 'soybean') {
      CWR = 3.91 * 153;
    } else if (cropDetails.cropName == 'wheat') {
      CWR = 3.1 * 120;
    } else if (cropDetails.cropName == 'onion') {
      CWR = 5.58 * 92;
    }

    // -------------------------------------

    // Step-2) Calculating Total ER per Season :
    let ER;

    if (cropDetails.growingSeason == 'kharif') {
      ER = 512;
    } else if (cropDetails.growingSeason == 'rabi') {
      ER = 56;
    } else if (cropDetails.growingSeason == 'zaid') {
      ER = 144;
    }

    // Step-3) Calculating EF per Season :
    let EF;

    if (gwfDetails.irrigationMethod == 'drip') {
      EF = 0.9;
    } else if (gwfDetails.irrigationMethod == 'sprinkler') {
      EF = 0.8;
    } else if (gwfDetails.irrigationMethod == 'furrow') {
      EF = 0.7;
    }

    // Step-4) Calculating GWU :
    const min = function (value1, value2) {
      if (value1 < value2) return value1;
      else return value2;
    };

    const GWU = min(CWR, ER) * EF;

    // Step-5) Calculating Final GWF :
    GWF = (GWU / yield) * landSize;
  }

  if (landDetails.taluka == 'khed') {
    // Step-1) Calculating CWR -> CWR = ETc * number of days per season :
    let CWR;
    if (cropDetails.cropName == 'jowar') {
      CWR = 3.915 * 153;
    } else if (cropDetails.cropName == 'bajra') {
      CWR = 3.78 * 153;
    } else if (cropDetails.cropName == 'cotton') {
      CWR = 4.185 * 153;
    } else if (cropDetails.cropName == 'sugarcane') {
      CWR = 3.485 * 120;
    } else if (cropDetails.cropName == 'rice') {
      CWR = 5.34 * 153;
    } else if (cropDetails.cropName == 'maize') {
      CWR = 3.915 * 153;
    } else if (cropDetails.cropName == 'groundnut') {
      CWR = 3.645 * 153;
    } else if (cropDetails.cropName == 'soybean') {
      CWR = 3.987 * 153;
    } else if (cropDetails.cropName == 'wheat') {
      CWR = 3.178 * 120;
    } else if (cropDetails.cropName == 'onion') {
      CWR = 5.684 * 92;
    }

    // -------------------------------------

    // Step-2) Calculating Total ER per Season :
    let ER;

    if (cropDetails.growingSeason == 'kharif') {
      ER = 920;
    } else if (cropDetails.growingSeason == 'rabi') {
      ER = 76;
    } else if (cropDetails.growingSeason == 'zaid') {
      ER = 90;
    }

    // Step-3) Calculating EF per Season :
    let EF;

    if (gwfDetails.irrigationMethod == 'drip') {
      EF = 0.9;
    } else if (gwfDetails.irrigationMethod == 'sprinkler') {
      EF = 0.8;
    } else if (gwfDetails.irrigationMethod == 'furrow') {
      EF = 0.7;
    }

    // Step-4) Calculating GWU :
    const min = function (value1, value2) {
      if (value1 < value2) return value1;
      else return value2;
    };

    const GWU = min(CWR, ER) * EF;

    // Step-5) Calculating Final GWF :
    GWF = (GWU / yield) * landSize;
  }

  if (landDetails.taluka == 'maval') {
    // Step-1) Calculating CWR -> CWR = ETc * number of days per season :
    let CWR;
    if (cropDetails.cropName == 'jowar') {
      CWR = 3.843 * 153;
    } else if (cropDetails.cropName == 'bajra') {
      CWR = 3.71 * 153;
    } else if (cropDetails.cropName == 'cotton') {
      CWR = 4.107 * 153;
    } else if (cropDetails.cropName == 'sugarcane') {
      CWR = 3.485 * 120;
    } else if (cropDetails.cropName == 'rice') {
      CWR = 5.232 * 153;
    } else if (cropDetails.cropName == 'maize') {
      CWR = 3.843 * 153;
    } else if (cropDetails.cropName == 'groundnut') {
      CWR = 3.577 * 153;
    } else if (cropDetails.cropName == 'soybean') {
      CWR = 3.911 * 153;
    } else if (cropDetails.cropName == 'wheat') {
      CWR = 3.178 * 120;
    } else if (cropDetails.cropName == 'onion') {
      CWR = 5.638 * 92;
    }

    // -------------------------------------

    // Step-2) Calculating Total ER per Season :
    let ER;

    if (cropDetails.growingSeason == 'kharif') {
      ER = 790;
    } else if (cropDetails.growingSeason == 'rabi') {
      ER = 12;
    } else if (cropDetails.growingSeason == 'zaid') {
      ER = 15;
    }

    // Step-3) Calculating EF per Season :
    let EF;

    if (gwfDetails.irrigationMethod == 'drip') {
      EF = 0.9;
    } else if (gwfDetails.irrigationMethod == 'sprinkler') {
      EF = 0.8;
    } else if (gwfDetails.irrigationMethod == 'furrow') {
      EF = 0.7;
    }

    // Step-4) Calculating GWU :
    const min = function (value1, value2) {
      if (value1 < value2) return value1;
      else return value2;
    };

    const GWU = min(CWR, ER) * EF;

    // Step-5) Calculating Final GWF :
    GWF = (GWU / yield) * landSize;
  }

  if (landDetails.taluka == 'mulshi') {
    // Step-1) Calculating CWR -> CWR = ETc * number of days per season :
    let CWR;
    if (cropDetails.cropName == 'jowar') {
      CWR = 3.76 * 153;
    } else if (cropDetails.cropName == 'bajra') {
      CWR = 3.63 * 153;
    } else if (cropDetails.cropName == 'cotton') {
      CWR = 4.02 * 153;
    } else if (cropDetails.cropName == 'sugarcane') {
      CWR = 3.45 * 120;
    } else if (cropDetails.cropName == 'rice') {
      CWR = 5.13 * 153;
    } else if (cropDetails.cropName == 'maize') {
      CWR = 3.76 * 153;
    } else if (cropDetails.cropName == 'groundnut') {
      CWR = 3.51 * 153;
    } else if (cropDetails.cropName == 'soybean') {
      CWR = 3.83 * 153;
    } else if (cropDetails.cropName == 'wheat') {
      CWR = 3.15 * 120;
    } else if (cropDetails.cropName == 'onion') {
      CWR = 5.54 * 92;
    }

    // -------------------------------------

    // Step-2) Calculating Total ER per Season :
    let ER;

    if (cropDetails.growingSeason == 'kharif') {
      ER = 825;
    } else if (cropDetails.growingSeason == 'rabi') {
      ER = 52.4;
    } else if (cropDetails.growingSeason == 'zaid') {
      ER = 24;
    }

    // Step-3) Calculating EF per Season :
    let EF;

    if (gwfDetails.irrigationMethod == 'drip') {
      EF = 0.9;
    } else if (gwfDetails.irrigationMethod == 'sprinkler') {
      EF = 0.8;
    } else if (gwfDetails.irrigationMethod == 'furrow') {
      EF = 0.7;
    }

    // Step-4) Calculating GWU :
    const min = function (value1, value2) {
      if (value1 < value2) return value1;
      else return value2;
    };

    const GWU = min(CWR, ER) * EF;

    // Step-5) Calculating Final GWF :
    GWF = (GWU / yield) * landSize;
  }

  if (landDetails.taluka == 'pune') {
    // Step-1) Calculating CWR -> CWR = ETc * number of days per season :
    let CWR;
    if (cropDetails.cropName == 'jowar') {
      CWR = 3.7 * 153;
    } else if (cropDetails.cropName == 'bajra') {
      CWR = 3.57 * 153;
    } else if (cropDetails.cropName == 'cotton') {
      CWR = 3.96 * 153;
    } else if (cropDetails.cropName == 'sugarcane') {
      CWR = 3.4 * 120;
    } else if (cropDetails.cropName == 'rice') {
      CWR = 5.04 * 153;
    } else if (cropDetails.cropName == 'maize') {
      CWR = 3.7 * 153;
    } else if (cropDetails.cropName == 'groundnut') {
      CWR = 3.44 * 153;
    } else if (cropDetails.cropName == 'soybean') {
      CWR = 3.76 * 153;
    } else if (cropDetails.cropName == 'wheat') {
      CWR = 3.1 * 120;
    } else if (cropDetails.cropName == 'onion') {
      CWR = 9.61 * 92;
    }

    // -------------------------------------

    // Step-2) Calculating Total ER per Season :
    let ER;

    if (cropDetails.growingSeason == 'kharif') {
      ER = 705;
    } else if (cropDetails.growingSeason == 'rabi') {
      ER = 11;
    } else if (cropDetails.growingSeason == 'zaid') {
      ER = 22.5;
    }

    // Step-3) Calculating EF per Season :
    let EF;

    if (gwfDetails.irrigationMethod == 'drip') {
      EF = 0.9;
    } else if (gwfDetails.irrigationMethod == 'sprinkler') {
      EF = 0.8;
    } else if (gwfDetails.irrigationMethod == 'furrow') {
      EF = 0.7;
    }

    // Step-4) Calculating GWU :
    const min = function (value1, value2) {
      if (value1 < value2) return value1;
      else return value2;
    };

    const GWU = min(CWR, ER) * EF;

    // Step-5) Calculating Final GWF :
    GWF = (GWU / yield) * landSize;
  }

  if (landDetails.taluka == 'purandhar') {
    // Step-1) Calculating CWR -> CWR = ETc * number of days per season :
    let CWR;
    if (cropDetails.cropName == 'jowar') {
      CWR = 3.99 * 153;
    } else if (cropDetails.cropName == 'bajra') {
      CWR = 3.85 * 153;
    } else if (cropDetails.cropName == 'cotton') {
      CWR = 4.26 * 153;
    } else if (cropDetails.cropName == 'sugarcane') {
      CWR = 3.57 * 120;
    } else if (cropDetails.cropName == 'rice') {
      CWR = 5.43 * 153;
    } else if (cropDetails.cropName == 'maize') {
      CWR = 3.99 * 153;
    } else if (cropDetails.cropName == 'groundnut') {
      CWR = 3.71 * 153;
    } else if (cropDetails.cropName == 'soybean') {
      CWR = 4.07 * 153;
    } else if (cropDetails.cropName == 'wheat') {
      CWR = 3.26 * 120;
    } else if (cropDetails.cropName == 'onion') {
      CWR = 9.83 * 92;
    }

    // -------------------------------------

    // Step-2) Calculating Total ER per Season :
    let ER;

    if (cropDetails.growingSeason == 'kharif') {
      ER = 430;
    } else if (cropDetails.growingSeason == 'rabi') {
      ER = 21;
    } else if (cropDetails.growingSeason == 'zaid') {
      ER = 56;
    }

    // Step-3) Calculating EF per Season :
    let EF;

    if (gwfDetails.irrigationMethod == 'drip') {
      EF = 0.9;
    } else if (gwfDetails.irrigationMethod == 'sprinkler') {
      EF = 0.8;
    } else if (gwfDetails.irrigationMethod == 'furrow') {
      EF = 0.7;
    }

    // Step-4) Calculating GWU :
    const min = function (value1, value2) {
      if (value1 < value2) return value1;
      else return value2;
    };

    const GWU = min(CWR, ER) * EF;

    // Step-5) Calculating Final GWF :
    GWF = (GWU / yield) * landSize;
  }

  if (landDetails.taluka == 'shirur') {
    // Step-1) Calculating CWR -> CWR = ETc * number of days per season :
    let CWR;
    if (cropDetails.cropName == 'jowar') {
      CWR = 3.915 * 153;
    } else if (cropDetails.cropName == 'bajra') {
      CWR = 3.78 * 153;
    } else if (cropDetails.cropName == 'cotton') {
      CWR = 4.185 * 153;
    } else if (cropDetails.cropName == 'sugarcane') {
      CWR = 3.485 * 120;
    } else if (cropDetails.cropName == 'rice') {
      CWR = 5.34 * 153;
    } else if (cropDetails.cropName == 'maize') {
      CWR = 3.915 * 153;
    } else if (cropDetails.cropName == 'groundnut') {
      CWR = 3.645 * 153;
    } else if (cropDetails.cropName == 'soybean') {
      CWR = 3.985 * 153;
    } else if (cropDetails.cropName == 'wheat') {
      CWR = 3.178 * 120;
    } else if (cropDetails.cropName == 'onion') {
      CWR = 10.126 * 92;
    }

    // -------------------------------------

    // Step-2) Calculating Total ER per Season :
    let ER;

    if (cropDetails.growingSeason == 'kharif') {
      ER = 452;
    } else if (cropDetails.growingSeason == 'rabi') {
      ER = 20;
    } else if (cropDetails.growingSeason == 'zaid') {
      ER = 96;
    }

    // Step-3) Calculating EF per Season :
    let EF;

    if (gwfDetails.irrigationMethod == 'drip') {
      EF = 0.9;
    } else if (gwfDetails.irrigationMethod == 'sprinkler') {
      EF = 0.8;
    } else if (gwfDetails.irrigationMethod == 'furrow') {
      EF = 0.7;
    }

    // Step-4) Calculating GWU :
    const min = function (value1, value2) {
      if (value1 < value2) return value1;
      else return value2;
    };

    const GWU = min(CWR, ER) * EF;

    // Step-5) Calculating Final GWF :
    GWF = (GWU / yield) * landSize;
  }

  if (landDetails.taluka == 'velhe') {
    // Step-1) Calculating CWR -> CWR = ETc * number of days per season :
    let CWR;
    if (cropDetails.cropName == 'jowar') {
      CWR = 3.66 * 153;
    } else if (cropDetails.cropName == 'bajra') {
      CWR = 3.54 * 153;
    } else if (cropDetails.cropName == 'cotton') {
      CWR = 3.91 * 153;
    } else if (cropDetails.cropName == 'sugarcane') {
      CWR = 3.53 * 120;
    } else if (cropDetails.cropName == 'rice') {
      CWR = 4.99 * 153;
    } else if (cropDetails.cropName == 'maize') {
      CWR = 3.66 * 153;
    } else if (cropDetails.cropName == 'groundnut') {
      CWR = 3.41 * 153;
    } else if (cropDetails.cropName == 'soybean') {
      CWR = 3.73 * 153;
    } else if (cropDetails.cropName == 'wheat') {
      CWR = 3.22 * 120;
    } else if (cropDetails.cropName == 'onion') {
      CWR = 9.91 * 92;
    }

    // -------------------------------------

    // Step-2) Calculating Total ER per Season :
    let ER;

    if (cropDetails.growingSeason == 'kharif') {
      ER = 925;
    } else if (cropDetails.growingSeason == 'rabi') {
      ER = 40.5;
    } else if (cropDetails.growingSeason == 'zaid') {
      ER = 27.9;
    }

    // Step-3) Calculating EF per Season :
    let EF;

    if (gwfDetails.irrigationMethod == 'drip') {
      EF = 0.9;
    } else if (gwfDetails.irrigationMethod == 'sprinkler') {
      EF = 0.8;
    } else if (gwfDetails.irrigationMethod == 'furrow') {
      EF = 0.7;
    }

    // Step-4) Calculating GWU :
    const min = function (value1, value2) {
      if (value1 < value2) return value1;
      else return value2;
    };

    const GWU = min(CWR, ER) * EF;

    // Step-5) Calculating Final GWF :
    GWF = (GWU / yield) * landSize;
  }

  // ----------------------------

  let finalResult;

  if (GWF) {
    finalResult = `Result : ${GWF.toFixed(2)} mm·hectare/kg`; // Calculation Output
  } else {
    finalResult = `Result : `;
  }

  const user = await User.findById(id);

  res.render('gwfcalculation.ejs', { user, result: finalResult });
});

// ****************************************
// TESTING REPORT GENERATION ROUTE

const ExcelJS = require('exceljs');

app.post('/api/reports/generate/:id', async (req, res) => {
  const { id } = req.params;
  if (GWF) {
    const userData = await User.findById(id);
    const landDetails = await Land.findOne({ userId: id });
    const cropDetails = await Crop.findOne({ userId: id });
    const gwfDetails = await Gwf.findOne({ userId: id });

    const workbook = new ExcelJS.Workbook();
    const sheet1 = workbook.addWorksheet('Land Details');
    const sheet2 = workbook.addWorksheet('Crop Details');
    const sheet3 = workbook.addWorksheet('GWF Details');
    const sheet4 = workbook.addWorksheet('GWF Report');

    sheet1.columns = [
      { header: 'Field', key: 'field' },
      { header: 'Value', key: 'value' },
    ];
    sheet1.addRow({ field: 'Land Size', value: landDetails.landSize });
    sheet1.addRow({ field: 'Taluka', value: landDetails.taluka });
    sheet1.addRow({ field: 'District', value: landDetails.district });
    sheet1.addRow({ field: 'Soil Name', value: landDetails.soilName });

    sheet2.columns = [
      { header: 'Field', key: 'field' },
      { header: 'Value', key: 'value' },
    ];
    sheet2.addRow({ field: 'Crop Name', value: cropDetails.cropName });
    sheet2.addRow({ field: 'Crop Yield', value: cropDetails.cropYield });
    sheet2.addRow({ field: 'Growing Season', value: cropDetails.growingSeason });

    sheet3.columns = [
      { header: 'Field', key: 'field' },
      { header: 'Value', key: 'value' },
    ];
    sheet3.addRow({ field: 'Irrigation Method', value: gwfDetails.irrigationMethod });
    sheet3.addRow({ field: 'Expected Yield', value: gwfDetails.expectedYield });
    sheet3.addRow({ field: 'Planting Date', value: gwfDetails.plantingDate.toLocaleDateString('en-IN') });

    sheet4.columns = [
      { header: 'Field', key: 'field' },
      { header: 'Value', key: 'value' },
    ];
    sheet4.addRow({ field: 'User', value: userData.name });
    sheet4.addRow({ field: 'Taluka', value: userData.taluka });
    sheet4.addRow({ field: 'GWF Result', value: `${GWF} mm·hectare/kg` });
    // Add more rows...

    const filePath = `./reports/${id}_report.xlsx`;
    await workbook.xlsx.writeFile(filePath);
    res.download(filePath);
  } else {
    res.redirect(`/calculate/gwfcalculation/${id}`);
  }
});

// ****************************************

app.listen(8080, () => {
  console.log(`app listening on port 8080`);
});
