const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');
const { dbSelect } = require('../databaseLogic');
//Get all invoices
router.get('/', async (req, res, next) => {
    try{
        let result = await db.query('SELECT * FROM invoices');
        if(result.rows.length === 0){
            const error = new ExpressError("No invoices to be found.", 204);
            next(error);
        }else{
            return res.status(200).send(JSON.stringify({"Invoices" : result.rows}));
        }
    }catch{
        const e = new ExpressError('Internal server error');
        next(e);
    }
    
})
//Get a specific invoice
router.get('/:id', async (req, res, next) => {

    try{
        const result = await db.query(`SELECT * FROM invoices WHERE id = '${req.params.id}'`);
        console.log(result);
        if(result.rows.length === 0){
            return next();
        }
    
        return res.status(200).send(JSON.stringify({"invoice" : result.rows}))
    }catch{
        const e = new ExpressError('ID must be an integer', 400);
        return next(e);
    }

})
//Add a new invoice
router.post('/', async (req, res, next) => {
    try{
        const { comp_code, amt, paid, paid_date } = req.body;
        const result = await db.query(`INSERT INTO invoices 
        (comp_Code, amt, paid, paid_date)
        VALUES ('${comp_code}', ${amt}, ${paid}, ${paid_date}) RETURNING id, comp_code, amt, paid, add_date, paid_date`);
    
        return res.status(201).send(JSON.stringify({ "Invoice" : result.rows}))
    }catch{
        const e = new ExpressError("Bad request", 400)
        return next(e);
    }
})
//Update an invoices amount
router.put('/:id', async (req, res, next) => {
    const { amt } = req.body;
    let e;
    if(amt <= 0 || parseFloat(amt) == NaN){
        e = new ExpressError('Amount must be a number greater than 0', 400);
        return next(e)
    }

    try{
        const result = await db.query(`UPDATE invoices SET amt = ${amt} WHERE id = ${req.params.id}
        RETURNING id, comp_code, amt, paid, add_date, paid_date`);
        if(result.rows.length === 0){
            return next()
        }
        return res.status(200).send(JSON.stringify({ "Invoice" : result.rows }));

    }catch{
        e = new ExpressError('Amt must only contain numbers', 400)
        next(e);
    }
})
//Delete an invoice
router.delete('/:id', async (req, res, next) => {
    try{
        const exists = await dbSelect('invoices', '*', `id = '${req.params.id}'`);
        console.log(exists);
        if(!exists){
            return next();
        }
        const result = await db.query(`DELETE FROM invoices WHERE id = ${req.params.id}`);
        return res.status(201).send(JSON.stringify({"status" : "DELETED" }))
    }catch{
        const e = new ExpressError('ID must be an integer', 400);
        next(e);
    }
})
module.exports = router;