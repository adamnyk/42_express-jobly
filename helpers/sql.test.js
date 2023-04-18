const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql")

describe("sqlForPartialUpdate", function () {
    test("Throws error if no data is submitted", function () {
        try {
            let data = {}
            sqlForPartialUpdate(data)
        }
        catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
    
    test("Returns correct data for single and double word coulmns", function () {

        let data = {name:"new name",yearsOld:5}
        const result = sqlForPartialUpdate(data, {yearsOld: "years_old"})
        console.log(result.setCols)
        console.log(result.values)

        expect(result.setCols).toEqual('"name"=$1, "years_old"=$2')
        expect(result.values).toEqual([ 'new name', 5 ])
    });
   
  });
  