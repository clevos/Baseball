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
    let sortColumn='teamID'
    if(req.query['sortColumn']){
        sortColumn=req.query['sortColumn']
    }
    let sortOrder ='asc'
    if(req.query['sortOrder']){
        sortOrder =req.query['sortOrder']
    }
    (async () => {
        const connection = await getMySQLConnection()
        try {
            await connection.beginTransaction()
            let results = await connection.query('Select distinct yearID From payroll order By yearID')
            const years = results[0]
            let salaries
            if (yearID && +yearID > 0) {
                results = await connection.query(`Select teamID, cast(sum(salary) as double) as total_sal, cast(avg(salary) as double) as avg_sal From payroll Where yearID = ${yearID} group by teamID order by ${sortColumn} ${sortOrder}`)
                salaries = results[0]
            }
            res.render('averageTeamSalariesPerYear', {
                "yearID": yearID,
                "years": years,
                "salaries": salaries,
                "sortOrder": sortOrder
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
    let sortColumn ='teamID'
    if(req.query['sortColumn']){
        sortColumn=req.query['sortColumn']
    }
    let sortOrder ='asc'
    if(req.query['sortOrder']){
        sortOrder=req.query['sortOrder']
    }
    (async () => {
        const connection = await getMySQLConnection()
        try {
            await connection.beginTransaction()
            let results = await connection.query('Select distinct yearID From payroll order By yearID')
            const years = results[0]
            let salaries
            if (yearID && +yearID > 0) {
                results = await connection.query(`Select teamID, won, cast(sum(salary) as double) as total_sal, cast(sum(salary)/won as double) as cost_per_win from payroll join team using(teamID,yearID) where payroll.yearID= ${yearID} group by payroll.teamID, won order by ${sortColumn} ${sortOrder}`)
                salaries = results[0]
            }
            res.render('teamPayrollPerWinPerYear', {
                "yearID": yearID,
                "years": years,
                "salaries": salaries,
                "sortOrder": sortOrder
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
    let sortColumn ='salary'
    if(req.query['sortColumn']){
        sortColumn=req.query['sortColumn']
    }
    let sortOrder ='asc'
    if(req.query['sortOrder']){
        sortOrder=req.query['sortOrder']
    }
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
                results = await connection.query(`select nameFirst as fname, nameLast as lname, salary
                From people join payroll on people.playerID=payroll.playerID
                where yearID=${yearID} and teamID ='${teamID}'
                order by ${sortColumn} ${sortOrder}`)
                salaries = results[0]
            }

            // need to render the HTML template
            res.render('salariesPerTeamPerYear', {
                "yearID": yearID,
                "teamID": teamID,
                "years": years,
                "teams": teams,
                "salaries":salaries,
                "sortOrder": sortOrder
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
    let sortColumn ='teamID'
    if(req.query['sortColumn']){
        sortColumn=req.query['sortColumn']
    }
    let sortOrder ='asc'
    if(req.query['sortOrder']){
        sortOrder=req.query['sortOrder']
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
              results=await connection.query(`select teamID,nameFirst as fname,nameLast as lname,salary from people Join payroll s on people.playerID =s.playerID
              where yearID= ${yearID} and salary =(select max(salary) from payroll where yearID=s.yearID and teamID =s.teamID) Order by ${sortColumn} ${sortOrder}`)
            salaries = results[0]
            
            }
          // Need to render the pug template
          res.render('highestPaidPlayersPerTeamPerYear',{"yearID": yearID,"years":years,"salaries":salaries,"sortOrder": sortOrder})
        } catch (error) {
            console.log(error)
            res.status(500).json({
                "status_message": "internal server error"
            })
        }
    })().catch(err => console.error(err.stack))
})


router.get('/graphAverageTeamSalariesPerYear',(req,res) => {
  let yearID 
  if(req.query['yearID']){
    yearID=req.query['yearID']
  }
  ;(async() => {
    const connection =await getMySQLConnection()
    try{
      await connection.beginTransaction()
      let teams
      let salaries
      if(yearID && +yearID>0){
        let results =await connection.query(`select teamID, cast(avg(salary) as double) as avg_sal From payroll Where yearID=${yearID} group By teamID order By teamID`)
        teams =results[0].map(t => t.teamID)
        salaries =results[0].map(t => t.avg_sal)
      }
      res.render('graph',{
        "title": `Average Team Salaries For ${yearID}`,
        "labels": teams,
        "data": salaries
      })
    }catch(err){
      console.log(err)
      res.status(500).json({
        "status_message": "internal server error"
    })
    }finally{
      connection.end()
    }
  })().catch(err => console.error(err.stack))
})

router.get('/graphTeamPayrollPerWinPerYear',(req,res) => {
  let yearID 
  if(req.query['yearID']){
    yearID=req.query['yearID']
  }
  ;(async() => {
    const connection =await getMySQLConnection()
    try{
      await connection.beginTransaction()
      let teams
      let salaries
      if(yearID && +yearID>0){
        let results =await connection.query(`select payroll.teamID, cast(sum(salary) /won as double) as cost_per_win From payroll join team using (teamID,yearID) Where payroll.yearID=${yearID} group By payroll.teamID Order By teamID`)
        teams =results[0].map(t => t.teamID)
        salaries =results[0].map(t => t.cost_per_win)
      }
      res.render('graph',{
        "title": ` Team Payroll Per Win For ${yearID}`,
        "labels": teams,
        "data": salaries
      })
    }catch(err){
      console.log(err)
      res.status(500).json({
        "status_message": "internal server error"
    })
    }finally{
      connection.end()
    }
  })().catch(err => console.error(err.stack))
})
router.get('/graphHighestPaidPlayersPerTeamPerYear',(req,res) => {
  let yearID 
  if(req.query['yearID']){
    yearID=req.query['yearID']
  }
  ;(async() => {
    const connection =await getMySQLConnection()
    try{
      await connection.beginTransaction()
      let players
      let salaries
      if(yearID && +yearID>0){
        let results =await connection.query(`select teamID,nameFirst as fName,nameLast as lname,salary From people p join payroll s On p.playerID=s.playerID Where YearID =${yearID} and salary=(select max(salary) From payroll Where yearID=s.yearID and teamID=s.teamID) Order By teamID`)
        players =results[0].map(t => `${t.fname} ${t.lname} (${t.teamID})`)
        salaries =results[0].map(t => t.salary)
      }
      res.render('graph',{
        "title": ` Highest Paid Players Per Team For ${yearID}`,
        "labels": players,
        "data": salaries
      })
    }catch(err){
      console.log(err)
      res.status(500).json({
        "status_message": "internal server error"
    })
    }finally{
      connection.end()
    }
  })().catch(err => console.error(err.stack))
})

router.get('/graphSalariesPerTeamPerYear',(req,res) => {
  let yearID 
  if(req.query['yearID']){
    yearID=req.query['yearID']
  }
  let teamID
  if(req.query['teamID']){
    teamID =req.query['teamID']
  }
  ;(async() => {
    const connection =await getMySQLConnection()
    try{
      await connection.beginTransaction()
      let players
      let salaries
      if(teamID && teamID!=='NONE'){
        let results =await connection.query(`select nameFirst as fname,nameLast as lname,salary From people Join payroll On people.playerID=payroll.playerID Where yearID=${yearID} and teamID='${teamID}' Order By lName`)
        players =results[0].map(t => `${t.fname} ${t.lname}`)
        salaries =results[0].map(t => t.salary)
      }
      res.render('graph',{
        "title": ` PayRoll Data For ${teamID} For ${yearID}`,
        "labels": players,
        "data": salaries
      })
    }catch(err){
      console.log(err)
      res.status(500).json({
        "status_message": "internal server error"
    })
    }finally{
      connection.end()
    }
  })().catch(err => console.error(err.stack))
})

module.exports = router