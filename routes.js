const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router()
const mysql = require('mysql2/promise')
const fs = require('fs')

router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());
async function getMySQLConnection() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'baseball',
        password: 'Test',
        database: 'baselmlk_baseball'
    })
    return connection
}

router.use((req, res, next) => {
    // console.log('Hello from router')
    next()
})

router.get('/', (req, res) => {
    res.status(200).send('Welcome to Baseball Salaries').end()
})
router.get('/averageTeamSalariesPerYear', (req, res) => {
    let yearID
    if(req.query['yearID']){
        yearID =req.query['yearID']
    }
    ;(async()=>{
        const connection =await getMySQLConnection()
        try {
            await connection.beginTransaction()
            let results = await connection.query('Select distinct yearID From salaries order By yearID')
            const years = results[0]
            let salaries 
            if(yearID && +yearID>0){
                 results = await connection.query(`Select teamID, cast(sum(salary) as double) as total_sal, cast(avg(salary) as double) as avg_sal From salaries Where yearID = ${yearID} group by teamID order by total_sal desc`)  
                 salaries = results[0]
                }
            res.render('averageTeamSalariesPerYear',{
                "yearID": yearID, "years": years,"salaries": salaries
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({"statuscode": 500,"message": "error occurred"})
        }finally {
            connection.end();
        }
    })().catch(err => console.error(err.stack))
})

module.exports=router