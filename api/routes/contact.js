const express = require('express');

const path = require('path');
const router = express.Router();
const Contact = require('../models/Contact');




router.post('/', async (req, res) => {
    const { name, email, message } = req.body;
  
    const newContact = new Contact({
      name,
      email,
      message
    });
  
    try {
      await newContact.save();
      res.status(200).json({ message: 'Thank you for contacting us!' });
    } catch (error) {
      console.error('Error saving contact form data:', error);
      res.status(500).json({ message: 'An error occurred while saving the data. Please try again later.' });
    }
  });













module.exports = router;