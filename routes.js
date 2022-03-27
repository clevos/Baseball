const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router()
const mysql = require('mysql2/promise')
const fs = require('fs')

router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());

router.use((req, res, next) => {
    // console.log('Hello from router')
    next()
})

router.get('/', (req, res) => {
    res.status(200).send('Welcome to Baseball Salaries').end()
})

module.exports=router