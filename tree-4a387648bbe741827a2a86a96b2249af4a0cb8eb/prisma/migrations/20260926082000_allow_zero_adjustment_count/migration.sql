-- A physical count may be zero. Movement quantities stay strictly positive.
-- Receipt, delivery, and transfer lines still cannot be zero.

ALTER TABLE "stock_operation_items" DROP CONSTRAINT "stock_operation_items_requested_positive";
ALTER TABLE "stock_operation_items" DROP CONSTRAINT "stock_operation_items_processed_within_requested";

ALTER TABLE "stock_operation_items"
ADD CONSTRAINT "stock_operation_items_requested_non_negative" CHECK ("requested_quantity" >= 0);

CREATE FUNCTION "enforce_operation_item_quantity"() RETURNS trigger AS $$
DECLARE
    operation_type "operation_type";
BEGIN
    SELECT "type" INTO operation_type
    FROM "stock_operations"
    WHERE "id" = NEW."operation_id";

    IF operation_type IS DISTINCT FROM 'ADJUSTMENT' THEN
        IF NEW."requested_quantity" <= 0 THEN
            RAISE EXCEPTION 'receipt, delivery, and transfer quantities must be greater than zero';
        END IF;

        IF NEW."processed_quantity" > NEW."requested_quantity" THEN
            RAISE EXCEPTION 'processed quantity cannot exceed requested quantity';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "stock_operation_items_quantity_rules"
BEFORE INSERT OR UPDATE ON "stock_operation_items"
FOR EACH ROW EXECUTE FUNCTION "enforce_operation_item_quantity"();
