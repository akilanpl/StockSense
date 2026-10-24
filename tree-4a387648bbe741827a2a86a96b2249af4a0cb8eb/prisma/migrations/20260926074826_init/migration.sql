-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('INVENTORY_MANAGER', 'WAREHOUSE_STAFF');

-- CreateEnum
CREATE TYPE "partner_type" AS ENUM ('SUPPLIER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "location_type" AS ENUM ('VIEW', 'INTERNAL', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "operation_type" AS ENUM ('RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "operation_status" AS ENUM ('DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED');

-- CreateEnum
CREATE TYPE "movement_type" AS ENUM ('RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "partner_type" NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units_of_measure" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_of_measure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category_id" UUID NOT NULL,
    "unit_of_measure_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "parent_id" UUID,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "location_type" NOT NULL DEFAULT 'INTERNAL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_operations" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "operation_type" NOT NULL,
    "status" "operation_status" NOT NULL DEFAULT 'DRAFT',
    "partner_id" UUID,
    "source_location_id" UUID,
    "destination_location_id" UUID,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "validated_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),

    CONSTRAINT "stock_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_operation_items" (
    "id" UUID NOT NULL,
    "operation_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "requested_quantity" DECIMAL(18,4) NOT NULL,
    "processed_quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_operation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_moves" (
    "id" UUID NOT NULL,
    "operation_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "source_location_id" UUID,
    "destination_location_id" UUID,
    "quantity" DECIMAL(18,4) NOT NULL,
    "movement_type" "movement_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "stock_moves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_quants" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_quants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reorder_rules" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "minimum_quantity" DECIMAL(18,4) NOT NULL,
    "target_quantity" DECIMAL(18,4) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reorder_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "partners_type_idx" ON "partners"("type");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "units_of_measure_code_key" ON "units_of_measure"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_unit_of_measure_id_idx" ON "products"("unit_of_measure_id");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE INDEX "locations_parent_id_idx" ON "locations"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "locations_warehouse_id_code_key" ON "locations"("warehouse_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "stock_operations_reference_key" ON "stock_operations"("reference");

-- CreateIndex
CREATE INDEX "stock_operations_type_idx" ON "stock_operations"("type");

-- CreateIndex
CREATE INDEX "stock_operations_status_idx" ON "stock_operations"("status");

-- CreateIndex
CREATE INDEX "stock_operations_created_at_idx" ON "stock_operations"("created_at");

-- CreateIndex
CREATE INDEX "stock_operations_partner_id_idx" ON "stock_operations"("partner_id");

-- CreateIndex
CREATE INDEX "stock_operations_source_location_id_idx" ON "stock_operations"("source_location_id");

-- CreateIndex
CREATE INDEX "stock_operations_destination_location_id_idx" ON "stock_operations"("destination_location_id");

-- CreateIndex
CREATE INDEX "stock_operations_created_by_id_idx" ON "stock_operations"("created_by_id");

-- CreateIndex
CREATE INDEX "stock_operation_items_operation_id_idx" ON "stock_operation_items"("operation_id");

-- CreateIndex
CREATE INDEX "stock_operation_items_product_id_idx" ON "stock_operation_items"("product_id");

-- CreateIndex
CREATE INDEX "stock_moves_product_id_idx" ON "stock_moves"("product_id");

-- CreateIndex
CREATE INDEX "stock_moves_source_location_id_idx" ON "stock_moves"("source_location_id");

-- CreateIndex
CREATE INDEX "stock_moves_destination_location_id_idx" ON "stock_moves"("destination_location_id");

-- CreateIndex
CREATE INDEX "stock_moves_operation_id_idx" ON "stock_moves"("operation_id");

-- CreateIndex
CREATE INDEX "stock_moves_created_at_idx" ON "stock_moves"("created_at");

-- CreateIndex
CREATE INDEX "stock_quants_location_id_idx" ON "stock_quants"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_quants_product_id_location_id_key" ON "stock_quants"("product_id", "location_id");

-- CreateIndex
CREATE INDEX "reorder_rules_location_id_idx" ON "reorder_rules"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "reorder_rules_product_id_location_id_key" ON "reorder_rules"("product_id", "location_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_unit_of_measure_id_fkey" FOREIGN KEY ("unit_of_measure_id") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_operations" ADD CONSTRAINT "stock_operations_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_operations" ADD CONSTRAINT "stock_operations_source_location_id_fkey" FOREIGN KEY ("source_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_operations" ADD CONSTRAINT "stock_operations_destination_location_id_fkey" FOREIGN KEY ("destination_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_operations" ADD CONSTRAINT "stock_operations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_operation_items" ADD CONSTRAINT "stock_operation_items_operation_id_fkey" FOREIGN KEY ("operation_id") REFERENCES "stock_operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_operation_items" ADD CONSTRAINT "stock_operation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_operation_id_fkey" FOREIGN KEY ("operation_id") REFERENCES "stock_operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_source_location_id_fkey" FOREIGN KEY ("source_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_destination_location_id_fkey" FOREIGN KEY ("destination_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_quants" ADD CONSTRAINT "stock_quants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_quants" ADD CONSTRAINT "stock_quants_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_rules" ADD CONSTRAINT "reorder_rules_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_rules" ADD CONSTRAINT "reorder_rules_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Integrity checks Prisma cannot express in the schema language.
ALTER TABLE "users" ADD CONSTRAINT "users_name_not_blank" CHECK (char_length(btrim("name")) > 0);
ALTER TABLE "users" ADD CONSTRAINT "users_email_format" CHECK ("email" ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');
ALTER TABLE "users" ADD CONSTRAINT "users_password_hash_not_blank" CHECK (char_length("password_hash") > 0);

ALTER TABLE "partners" ADD CONSTRAINT "partners_name_not_blank" CHECK (char_length(btrim("name")) > 0);
ALTER TABLE "partners" ADD CONSTRAINT "partners_email_format" CHECK ("email" IS NULL OR "email" ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');

ALTER TABLE "categories" ADD CONSTRAINT "categories_name_not_blank" CHECK (char_length(btrim("name")) > 0);

ALTER TABLE "units_of_measure" ADD CONSTRAINT "units_of_measure_code_not_blank" CHECK (char_length(btrim("code")) > 0);
ALTER TABLE "units_of_measure" ADD CONSTRAINT "units_of_measure_name_not_blank" CHECK (char_length(btrim("name")) > 0);

ALTER TABLE "products" ADD CONSTRAINT "products_name_not_blank" CHECK (char_length(btrim("name")) > 0);
ALTER TABLE "products" ADD CONSTRAINT "products_sku_not_blank" CHECK (char_length(btrim("sku")) > 0);

ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_name_not_blank" CHECK (char_length(btrim("name")) > 0);
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_code_not_blank" CHECK (char_length(btrim("code")) > 0);

ALTER TABLE "locations" ADD CONSTRAINT "locations_name_not_blank" CHECK (char_length(btrim("name")) > 0);
ALTER TABLE "locations" ADD CONSTRAINT "locations_code_not_blank" CHECK (char_length(btrim("code")) > 0);
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_not_self" CHECK ("parent_id" IS NULL OR "parent_id" <> "id");

ALTER TABLE "stock_operations" ADD CONSTRAINT "stock_operations_reference_not_blank" CHECK (char_length(btrim("reference")) > 0);
ALTER TABLE "stock_operations" ADD CONSTRAINT "stock_operations_locations_distinct" CHECK (
    "source_location_id" IS NULL
    OR "destination_location_id" IS NULL
    OR "source_location_id" <> "destination_location_id"
);

ALTER TABLE "stock_operation_items" ADD CONSTRAINT "stock_operation_items_requested_positive" CHECK ("requested_quantity" > 0);
ALTER TABLE "stock_operation_items" ADD CONSTRAINT "stock_operation_items_processed_non_negative" CHECK ("processed_quantity" >= 0);
ALTER TABLE "stock_operation_items" ADD CONSTRAINT "stock_operation_items_processed_within_requested" CHECK ("processed_quantity" <= "requested_quantity");

ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_has_location" CHECK (
    "source_location_id" IS NOT NULL OR "destination_location_id" IS NOT NULL
);
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_locations_distinct" CHECK (
    "source_location_id" IS NULL
    OR "destination_location_id" IS NULL
    OR "source_location_id" <> "destination_location_id"
);

ALTER TABLE "stock_quants" ADD CONSTRAINT "stock_quants_quantity_non_negative" CHECK ("quantity" >= 0);

ALTER TABLE "reorder_rules" ADD CONSTRAINT "reorder_rules_minimum_non_negative" CHECK ("minimum_quantity" >= 0);
ALTER TABLE "reorder_rules" ADD CONSTRAINT "reorder_rules_target_at_least_minimum" CHECK ("target_quantity" >= "minimum_quantity");

-- Ledger rows and finished documents stay in place. Draft documents can still be removed.
CREATE FUNCTION "prevent_stock_move_delete"() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'stock moves are historical and cannot be deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "stock_moves_no_delete"
BEFORE DELETE ON "stock_moves"
FOR EACH ROW EXECUTE FUNCTION "prevent_stock_move_delete"();

CREATE FUNCTION "prevent_finished_operation_delete"() RETURNS trigger AS $$
BEGIN
    IF OLD."status" IN ('DONE', 'CANCELED') THEN
        RAISE EXCEPTION 'finished stock operations cannot be deleted';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "stock_operations_protect_finished"
BEFORE DELETE ON "stock_operations"
FOR EACH ROW EXECUTE FUNCTION "prevent_finished_operation_delete"();
