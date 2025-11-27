-- AlterTable
ALTER TABLE "AttributeDefinition" ADD COLUMN     "maxDate" TIMESTAMP(3),
ADD COLUMN     "maxNumber" DOUBLE PRECISION,
ADD COLUMN     "minDate" TIMESTAMP(3),
ADD COLUMN     "minNumber" DOUBLE PRECISION;
