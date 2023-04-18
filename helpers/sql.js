const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/** Creates an SQL query for partial updates.
 * 
 * dataToUpdate: object of properties and values to update.
 * 
 * jsToSql: object of column names in JS and SQL format to be updated 
 *         This only needs to be included if column names are more than two words. 
 *        
 *        {jsColumnName: "sql_column_name", 
 *        compCode: "comp_code"}
 * 
 * RETURNS: sql query text for columns to set AND their parameterized values
 * 
 *          {
 *          {setCols: '"col_name_1 = $1"', '"col_name_2 = $2"', ...}
 *          {values: ['value 1', 'value 2']}
 *          }
 * 
 * Throws BadRequestError if dataToUpdate object is empty.
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
