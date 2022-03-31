const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router()
const mysql = require('mysql2/promise')
const fs = require('fs')
const { Router } = require('express')

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
    if (req.query['yearID']) {
        yearID = req.query['yearID']
    };
    (async () => {
        const connection = await getMySQLConnection()
        try {
            await connection.beginTransaction()
            let results = await connection.query('Select distinct yearID From salaries order By yearID')
            const years = results[0]
            let salaries
            if (yearID && +yearID > 0) {
                results = await connection.query(`Select teamID, cast(sum(salary) as double) as total_sal, cast(avg(salary) as double) as avg_sal From salaries Where yearID = ${yearID} group by teamID order by total_sal desc`)
                salaries = results[0]
            }
            res.render('averageTeamSalariesPerYear', {
                "yearID": yearID,
                "years": years,
                "salaries": salaries
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                "statuscode": 500,
                "message": "error occurred"
            })
        } finally {
            connection.end();
        }
    })().catch(err => console.error(err.stack))
})

router.get('/teamPayrollPerWinPerYear', (req, res) => {
    let yearID
    if (req.query['yearID']) {
        yearID = req.query['yearID']
    };
    (async () => {
        const connection = await getMySQLConnection()
        try {
            await connection.beginTransaction()
            let results = await connection.query('Select distinct yearID From salaries order By yearID')
            const years = results[0]
            let salaries
            if (yearID && +yearID > 0) {
                results = await connection.query(`Select teamID, won, cast(sum(salary) as double) as total_sal, cast(sum(salary)/won as double) as cost_per_win from salaries join team using(teamID,yearID) where salaries.yearID= ${yearID} group by salaries.teamID, won order by cost_per_win desc`)
                salaries = results[0]
            }
            res.render('teamPayrollPerWinPerYear', {
                "yearID": yearID,
                "years": years,
                "salaries": salaries
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                "statuscode": 500,
                "message": "error occurred"
            })
        } finally {
            connection.end();
        }
    })().catch(err => console.error(err.stack))
})

router.get('/salariesPerTeamPerYear', (req, res) => {
    let yearID
    let teamID
    if (req.query['yearID']) {
        yearID = req.query['yearID']
    }
    if (req.query['teamID']) {
        teamID = req.query['teamID']
    };
    (async () => {
        const connection = await getMySQLConnection()
        try {
            await connection.beginTransaction()
            let results = await connection.query('select distinct yearID from team where yearID > 0 order by yearID')
            const years = results[0]
            let teams
            if (yearID && +yearID > 0) {
                results = await connection.query(`select teamID From team where yearID = ${yearID} order By teamID`)
                teams = results[0]
            }
            // need to execute query for players salaries 
            let salaries
            if (teamID && teamID !== 'none') {
                results = await connection.query(`select fname, lname, salary
                From players join salaries on players.id=salaries.playerID
                where yearID=${yearID} and teamID ='${teamID}'
                order by salary desc`)
                salaries = results[0]
            }

            // need to render the HTML template
            res.render('salariesPerTeamPerYear', {
                "yearID": yearID,
                "teamID": teamID,
                "years": years,
                "teams": teams,
                "salaries":salaries
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                "status_message": "internal server error"
            })
        } finally {
            connection.end()
        }
    })().catch(err => console.error(err.stack))
})
router.get('/highestPaidPlayersPerTeamPerYear',(req,res) => {
    let yearID 
    if(req.query['yearID']){
        yearID = req.query['yearID']
    }
    ;(async() =>{
        const connection = await getMySQLConnection()
        try {
          await connection.beginTransaction()
          let results =await connection.query(`select distinct yearID from team where yearID >0 Order By yearID`)
          const years = results[0]
          // Need to execute the query to select highest paid players
          let salaries
          if(yearID && +yearID>0){
              results=await connection.query(`select teamID,fname,lname,salary from players Join salaries s on players.id =s.playerID
              where yearID= ${yearID} and salary =(select max(salary) from salaries where yearID=s.yearID and teamID =s.teamID)`)
            salaries = results[0]
            
            }
          // Need to render the pug template
          res.render('highestPaidPlayersPerTeamPerYear',{"yearID": yearID,"years":years,"salaries":salaries})
        } catch (error) {
            console.log(error)
            res.status(500).json({
                "status_message": "internal server error"
            })
        }
    })().catch(err => console.error(err.stack))
})
module.exports = router