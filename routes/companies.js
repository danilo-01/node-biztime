const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');
const { dbSelect } = require('../databaseLogic');

//Gets data about all companies
router.get('/', async (req, res, next) => {
    const result = await db.query("SELECT * FROM companies");
    return res.status(200).send(JSON.stringify(result.rows))
})

//Gets data about a specific company
router.get('/:code', async (req, res, next) => {
    const { code } = req.params;
    const result = await db.query("SELECT * FROM companies WHERE code=$1", [code]);
    const invoicesResult = await db.query(`SELECT * FROM invoices WHERE comp_code = '${req.params.code}'`);

    if(result.rows.length == 0 ){
        return next();
    }else{
        return res.status(200).send(JSON.stringify({
            "Company" : result.rows,
            "Invoices" : invoicesResult.rows
        }))
    }
})

//Add a company to database
router.post('/', async (req, res, next) => {
    try{
        const { code , name, description } = req.body;
        const result = await db.query(`INSERT INTO companies 
        (code, name, description) 
        VALUES($1, $2, $3)
        RETURNING code, name, description`,
        [code, name, description]);
    
        return res.status(201).send(JSON.stringify(result.rows));
    }catch(e){
        return next(e);
    }
})

//Update a company
router.put('/:code', async (req, res, next) => {
    const { code , name, description } = req.body;
    const old_code = req.params.code;
    const exists = await dbSelect('companies', '*', `code = '${old_code}'`);

    if(!exists){
        return next();
    }

  try{
    await db.query(`ALTER TABLE invoices DROP CONSTRAINT invoices_comp_code_fkey`);

    const result = await db.query(`
    UPDATE companies SET 
    code=$1, name=$2, description=$3
    WHERE code='${old_code}' RETURNING code, name, description`,
    [code, name, description]);

    await db.query(`UPDATE invoices SET 
    comp_code=$1 
    WHERE comp_code='${old_code}'`,
    [code])

    await db.query(`ALTER TABLE invoices ADD CONSTRAINT
    invoices_comp_code_fkey FOREIGN KEY (comp_code) 
    REFERENCES companies (code)`);
    
    return res.status(200).send(JSON.stringify(result.rows));
  }catch{
      await db.query(`ALTER TABLE invoices ADD CONSTRAINT
      invoices_comp_code_fkey FOREIGN KEY (comp_code) 
      REFERENCES companies (code)`);
      const error = new ExpressError('Two companies cannot have the same code.', 400)
      return next(error)
  }
})

//DELETE a company

router.delete('/:code', async (req, res, next) => {
    const { code } = req.params;
    const exists = await dbSelect('companies', '*', `code = '${code}'`);

    if(!exists){
        return next();
    }

    try{
        await db.query(`ALTER TABLE invoices DROP CONSTRAINT invoices_comp_code_fkey`);
        await db.query(`DELETE FROM invoices WHERE comp_code=$1`, [code]);
        await db.query('DELETE FROM companies WHERE code=$1', [code]);
        await db.query(`ALTER TABLE invoices ADD CONSTRAINT
        invoices_comp_code_fkey FOREIGN KEY (comp_code) 
        REFERENCES companies (code)`);
    }catch(e){
        await db.query(`ALTER TABLE invoices ADD CONSTRAINT
        invoices_comp_code_fkey FOREIGN KEY (comp_code) 
        REFERENCES companies (code)`);
        return next()
    }

    res.status(201).send(JSON.stringify({
        "Status" : "Deleted"
    }))
})





module.exports = router;