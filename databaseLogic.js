const db = require('./db');
//lF stands for 
const dbSelect = async (table, selectors='*', condition='') => {
    const where = `WHERE ${condition}`;
    selectors = selectors.split(' ');
    let selectorString = '';

    if(selectors[0] !== '*' && selectors.length === 1){
        for(let selector of selectors){
            selectorString += selector + ' ';
        }
        selectorString = selectorString.substring(0, selectorString.length -1);
    }else{
        selectorString = '*';
    }
    
    const result = await db.query(`SELECT ${selectorString} FROM ${table} ${where}`);

    if(result.rows.length !== 0){
        return true;
    }

    return false;
}

module.exports = {
 dbSelect
}