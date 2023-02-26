/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");


/** A reservation for a party */

class Reservation {
  constructor({id, customerId, numGuests, startAt, notes}) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /**methods for get and set number of guests */
  
  set numGuests ( v )
  {
    if ( v < 1 ) throw new Error( "Can't make reservation with 1 guest." );
    this._numGuests = v;
  }

  get numGuests ()
  {
    return this._numGuests;
  }

  /**methods for getter and setter startAt time */

  set startAt(v) {
    if (v instanceof Date && !isNaN(v)) this._startAt = v;
    else throw new Error("Not a valid startAt.");
  }

  get startAt() {
    return this._startAt;
  }

  get formattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /**methods for getter and setter notes (notes can be blank string, not Null) */

  set notes ( v )
  {
    this._notes = v || "";
  }

  get notes ()
  {
    return this._notes;
  }

  /** methods for getter and setter customer ID: can once */

  set customerId ( v )
  {
    if ( this._customerId && this._customerId !== v )
      throw new Error( "Can't change customer Id." );
    this._customerId = v;
  }

  get customerId ()
  {
    return this._customerId;
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
        [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }

  /**find a reservation by id. */

  static async get ( id )
  {
    const result = await db.query(
      `SELECT id, 
              customer_id AS "customerID"
              num_guests AS "numGuests"
              start_at AS "startAt",
              notes
      FROM reservations
      WHERE id = $1`,
      [ id ] );
    let reservation = result.row[ 0 ];

    if ( reservation === undefined )
    {
      const e = new Error( `No reservation: ${id}` );
      e.status = 404;
      throw e;
    }

    return new Reservation( reservation );
  }

  /**save reservation */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.numGuests, this.startAt, this.notes]
      );
      this.id = result.rows[ 0 ].id;
    } else {
      await db.query(
        `UPDATE reservations SET num_guests=$1, start_at=$2, notes=$3
             WHERE id=$4`,
        [this.numGuests, this.startAt, this.notes, this.id]
      );
    }
  }
}


module.exports = Reservation;
