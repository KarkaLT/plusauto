import 'dotenv/config'
import prisma from '../lib/prisma'
import type { AttributeType } from '@prisma/client'

async function main() {
  console.log('Seeding categories and attribute definitions...')

  type SeedAttribute = {
    name: string
    key: string
    type: AttributeType | string
    required?: boolean
    options?: unknown
    minNumber?: number
    maxNumber?: number
    minDate?: string
    maxDate?: string
  }

  const seedData: { name: string; description?: string; attributes: SeedAttribute[] }[] = [
    {
      name: 'Automobiliai',
      description: 'Automobiliai',
      attributes: [
        {
          name: 'Metai',
          key: 'year',
          type: 'INT',
          required: true,
          minNumber: 1900,
          maxNumber: new Date().getFullYear() + 1,
        },
        { name: 'Gamintojas', key: 'make', type: 'STRING', required: true },
        { name: 'Modelis', key: 'model', type: 'STRING', required: true },
        { name: 'Rida', key: 'mileage', type: 'INT', minNumber: 0 },
        {
          name: 'Kuro tipas',
          key: 'fuel_type',
          type: 'ENUM',
          options: ['Benzinas', 'Dyzelinas', 'Elektrinis', 'Hibridinis'],
        },
        {
          name: 'Pavarų dėžė',
          key: 'transmission',
          type: 'ENUM',
          options: ['Mechaninė', 'Automatinė'],
        },
        { name: 'Spalva', key: 'color', type: 'STRING' },
        { name: 'Durys', key: 'doors', type: 'INT', minNumber: 2, maxNumber: 7 },
        {
          name: 'Pagaminimo data',
          key: 'manufacture_date',
          type: 'DATE',
          minDate: '1900-01-01T00:00:00.000Z',
          maxDate: new Date().toISOString(),
        },
      ],
    },
    {
      name: 'Dviračiai ir motociklai',
      description: 'Motociklai ir dviračiai',
      attributes: [
        { name: 'Metai', key: 'year', type: 'INT' },
        { name: 'Prekės ženklas', key: 'brand', type: 'STRING' },
        { name: 'Modelis', key: 'model', type: 'STRING' },
        {
          name: 'Tipas',
          key: 'type',
          type: 'ENUM',
          options: ['Plentas', 'Kalnų', 'Hibridinis', 'Kruizeris'],
        },
        { name: 'Variklio tūris (cc)', key: 'cc', type: 'INT' },
        { name: 'Rida', key: 'mileage', type: 'INT' },
      ],
    },
    {
      name: 'Dalys',
      description: 'Transporto priemonių dalys ir priedai',
      attributes: [
        { name: 'Dalies tipas', key: 'part_type', type: 'STRING' },
        { name: 'Tinka', key: 'compatible_with', type: 'STRING' },
        {
          name: 'Būklė',
          key: 'condition',
          type: 'ENUM',
          options: ['Naujas', 'Naudotas', 'Atnaujintas'],
        },
        { name: 'Gamintojas', key: 'manufacturer', type: 'STRING' },
      ],
    },
    {
      name: 'Paslaugos',
      description: 'Paslaugos (remontas, techninė priežiūra ir kt.)',
      attributes: [{ name: 'Trukmė (valandomis)', key: 'duration_hours', type: 'FLOAT' }],
    },
  ]

  for (const c of seedData) {
    const category = await prisma.category.upsert({
      where: { name: c.name },
      update: { description: c.description },
      create: { name: c.name, description: c.description },
    })

    const attrs = c.attributes.map((a) => ({
      categoryId: category.id,
      name: a.name,
      key: a.key,
      // cast to any so TypeScript accepts string literal values from data
      type: a.type as AttributeType,
      required: a.required ?? false,
      options: a.options ?? undefined,
      minNumber: a.minNumber ?? undefined,
      maxNumber: a.maxNumber ?? undefined,
      minDate: a.minDate ?? undefined,
      maxDate: a.maxDate ?? undefined,
    }))

    try {
      await prisma.attributeDefinition.createMany({ data: attrs, skipDuplicates: true })
    } catch {
      for (const a of attrs) {
        const exists = await prisma.attributeDefinition.findFirst({
          where: { categoryId: a.categoryId, key: a.key },
        })
        if (!exists) await prisma.attributeDefinition.create({ data: a })
      }
    }

    console.log(`Added category: ${category.name}`)
  }

  console.log('Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
