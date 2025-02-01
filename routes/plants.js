var express = require('express');
var router = express.Router();
const { Plant, Tracking } = require('../models/plant');
const User = require('../models/user');
const { checkBody } = require('../modules/checkBody')
const uniqid = require('uniqid');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');


// Récupère les plantes de l'utilisateur :
router.get('/:username', (req, res) => {
    User.findOne({ username: req.params.username }).then((toto) => {
        Plant.find({ user: toto._id })
            .then((data) => {
                if (data.length > 0) {
                    res.json({ result: true, plants: data });
                } else {
                    res.json({ result: false, error: 'No plant saved' });
                }
            });
    })
});

// Permet d'ajouter une nouvelle plante :
router.post('/add', async (req, res) => {
    if (!checkBody(req.body, ["username", "name", "description"])) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
    }
    let pictures = [];
    if (req.files && req.files.photoFromFront && req.files.photoFromFront.size > 0) {
        const photoPath = `./tmp/${uniqid()}.jpg`;
        await req.files.photoFromFront.mv(photoPath);
        const resultCloudinary = await cloudinary.uploader.upload(photoPath);
        fs.unlinkSync(photoPath);
        pictures.push(resultCloudinary.secure_url);
    }
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
        res.json({ result: false, error: 'User not found' });
        return;
    }
    const newPlant = new Plant({
        date: Date.now(),
        user: user._id,
        name: req.body.name,
        description: req.body.description,
        pictures: pictures,
        tracking: [],
    });
    await newPlant.save();
    const data = await Plant.findOne({ _id: newPlant._id });
    if (data) {
        res.json({ result: true, data });
    } else {
        res.json({ result: false, error: 'Plant not saved' });
    }
});

// Permet de supprimer une plante :
router.delete('/:_id', (req, res) => {
    Plant.deleteOne({ _id: req.params._id })
        .then(() => {
            Plant.findById(`${req.params._id}`)
                .then((data) => {
                    if (!data) {
                        res.json({ result: true, message: 'Plant deleted' });
                    } else {
                        res.json({ result: false, error: 'Plant not deleted' });
                    }
                });
        });
});

// Récupère les photos de la plante :
router.get('/pictures/:_id', (req, res) => {
    Plant.findOne({ _id: req.params._id })
        .then((data) => {
            if (data.pictures.length > 0) {
                res.json({ result: true, pictures: data.pictures });
            } else {
                res.json({ result: false, error: 'No pictures saved' });
            }
        })
});

// Permet d'ajouter la photo d'une plante :
router.put('/addPicture/:_id', async (req, res) => {
    if (!req.files || !req.files.photoFromFront) {
        return res.status(400).json({ result: false, error: 'No file uploaded' });
    }
    const photoPath = `./tmp/${uniqid()}.jpg`;
    await req.files.photoFromFront.mv(photoPath);
    // const resultCloudinary = await cloudinary.uploader.upload(photoPath);
    const resultCloudinary = await cloudinary.uploader.upload(photoPath, {
        transformation: [
            { width: 800, height: 800, crop: 'fill' }  // Redimensionner et couper si nécessaire
        ]
    });
    
    fs.unlinkSync(photoPath);
    const plant = await Plant.updateOne(
        { _id: req.params._id },
        { $push: { pictures: resultCloudinary.secure_url } }
    );
    if (plant.nModified === 0) {
        return res.status(404).json({ result: false, error: 'Plant not found' });
    }
    res.json({ result: true, message: 'Photo added successfully', url: resultCloudinary.secure_url });
});

// Permet de supprimer la photo d'une plante :
router.delete('/deletePicture/:_id', (req, res) => {
    Plant.updateOne(
        { _id: req.params._id },
        { $pull: { pictures: req.body.picture } },
    ).then(() => {
        res.json({ result: true, deleted: req.body.picture });
    });
});

// Récupère les photos des plantes de l'utilisateur :
router.get('/allPictures/:username', (req, res) => {
    User.findOne({ username: req.params.username })
        .then((toto) => {
            const user = toto._id;
            Plant.find({ user })
                .then(plants => {
                    if (plants.length > 0) {
                        const plantsWithPictures = plants.map(plant => ({
                            id: plant._id,
                            name: plant.name,
                            pictures: plant.pictures,
                        }));
                        res.json({ result: true, plants: plantsWithPictures });

                    } else {
                        res.json({ result: false, error: 'No plant saved' });
                    }
                });
        });
});

// Récupère les tâches d'une plante pour une date spécifique :
router.get("/:plantId/events", async (req, res) => {
        const plantId = req.params.plantId;
        const plant = await Plant.findById(plantId).populate("tracking");
        if (!plant) {
            return res.json({ message: "Plante non trouvée" });
        }
        // Récupère toutes les tâches par date
        const tasks = plant.tracking.reduce((acc, tracking) => {
            const dateKey = tracking.date.toISOString().split('T')[0];
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(...tracking.tasks);
            return acc;
        }, {});
        return res.json(tasks);
});


// Route pour ajouter une tâche à une plante pour une date donnée :
router.post("/:plantId/add-task", async (req, res) => {
        const { date, task } = req.body;
        const plantId = req.params.plantId;
        const plant = await Plant.findById(plantId);
        if (!plant) {
            return res.json({ message: "Plante non trouvée" });
        }
        const trackingDate = new Date(date);
        const tracking = plant.tracking.find(t => t.date.toISOString().split('T')[0] === trackingDate.toISOString().split('T')[0]);
        if (tracking) {
            tracking.tasks.push(task);
        } else {
            plant.tracking.push({ date: trackingDate, tasks: [task] });
        }
        await plant.save();
        return res.json({ message: "Tâche ajoutée avec succès" });
});

module.exports = router;