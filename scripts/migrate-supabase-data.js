/**
 * Supabase Data Migration Script (JavaScript version)
 * For environments without TypeScript support
 */

const { createClient } = require('@supabase/supabase-js')

// Table migration order (respects foreign key dependencies)
const MIGRATION_ORDER = [
  'vehicle_types',
  'shifts',
  'services',
  'locations',
  'operators',
  'users',
  'vehicles',
  'drivers',
  'driver_operators',
  'routes',
  'schedules',
  'vehicle_badges',
  'vehicle_documents',
  'dispatch_records',
  'invoices',
  'violations',
  'operation_notices',
  'audit_logs',
]

class SupabaseMigrator {
  constructor(oldUrl, oldKey, newUrl, newKey) {
    this.oldClient = createClient(oldUrl, oldKey)
    this.newClient = createClient(newUrl, newKey)
    this.stats = []
  }

  async exportTable(table) {
    console.log(`📤 Exporting ${table}...`)
    
    let allData = []
    let from = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error } = await this.oldClient
        .from(table)
        .select('*')
        .range(from, from + pageSize - 1)
        .order('created_at', { ascending: true })

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.log(`  ⚠️  Table ${table} not found or empty`)
          break
        }
        throw new Error(`Failed to export ${table}: ${error.message}`)
      }

      if (!data || data.length === 0) {
        hasMore = false
      } else {
        allData = allData.concat(data)
        from += pageSize
        
        if (data.length < pageSize) {
          hasMore = false
        }
      }
    }

    console.log(`  ✅ Exported ${allData.length} records from ${table}`)
    return allData
  }

  async importTable(table, data) {
    if (data.length === 0) {
      console.log(`  ⏭️  Skipping ${table} (no data)`)
      return 0
    }

    console.log(`📥 Importing ${data.length} records into ${table}...`)

    let imported = 0
    const batchSize = 100

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      
      const { error } = await this.newClient
        .from(table)
        .upsert(batch, { onConflict: 'id' })

      if (error) {
        console.error(`  ❌ Error importing batch ${Math.floor(i / batchSize) + 1}:`, error.message)
        for (const record of batch) {
          try {
            const { error: singleError } = await this.newClient
              .from(table)
              .upsert(record, { onConflict: 'id' })
            
            if (singleError) {
              console.error(`    ⚠️  Failed to import record ${record.id}:`, singleError.message)
            } else {
              imported++
            }
          } catch (err) {
            console.error(`    ⚠️  Exception importing record ${record.id}:`, err.message)
          }
        }
      } else {
        imported += batch.length
      }

      if ((i + batchSize) % 500 === 0 || i + batchSize >= data.length) {
        console.log(`  📊 Progress: ${Math.min(i + batchSize, data.length)}/${data.length} records`)
      }
    }

    console.log(`  ✅ Imported ${imported}/${data.length} records into ${table}`)
    return imported
  }

  async migrateTable(table) {
    const startTime = Date.now()
    let exported = 0
    let imported = 0
    let errors = 0

    try {
      const data = await this.exportTable(table)
      exported = data.length

      if (data.length > 0) {
        imported = await this.importTable(table, data)
        errors = exported - imported
      }
    } catch (error) {
      console.error(`  ❌ Error migrating ${table}:`, error.message)
      errors = exported
    }

    const duration = Date.now() - startTime

    return {
      table,
      exported,
      imported,
      errors,
      duration,
    }
  }

  async migrateAll() {
    console.log('🚀 Starting Supabase data migration...\n')
    console.log(`📋 Migration order: ${MIGRATION_ORDER.join(' → ')}\n`)

    for (const table of MIGRATION_ORDER) {
      try {
        const stats = await this.migrateTable(table)
        this.stats.push(stats)
        console.log(`✅ Completed ${table} (${stats.duration}ms)\n`)
      } catch (error) {
        console.error(`❌ Failed to migrate ${table}:`, error.message)
        this.stats.push({
          table,
          exported: 0,
          imported: 0,
          errors: 1,
          duration: 0,
        })
      }
    }

    this.printSummary()
  }

  printSummary() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(60) + '\n')

    const totalExported = this.stats.reduce((sum, s) => sum + s.exported, 0)
    const totalImported = this.stats.reduce((sum, s) => sum + s.imported, 0)
    const totalErrors = this.stats.reduce((sum, s) => sum + s.errors, 0)
    const totalDuration = this.stats.reduce((sum, s) => sum + s.duration, 0)

    console.log('Table Migration Results:')
    console.log('-'.repeat(60))
    console.log(
      'Table'.padEnd(25) +
      'Exported'.padEnd(12) +
      'Imported'.padEnd(12) +
      'Errors'.padEnd(10) +
      'Duration'
    )
    console.log('-'.repeat(60))

    for (const stat of this.stats) {
      const status = stat.errors === 0 ? '✅' : '⚠️'
      console.log(
        `${status} ${stat.table.padEnd(22)}` +
        `${stat.exported.toString().padEnd(12)}` +
        `${stat.imported.toString().padEnd(12)}` +
        `${stat.errors.toString().padEnd(10)}` +
        `${(stat.duration / 1000).toFixed(2)}s`
      )
    }

    console.log('-'.repeat(60))
    console.log(
      `TOTAL`.padEnd(25) +
      `${totalExported.toString().padEnd(12)}` +
      `${totalImported.toString().padEnd(12)}` +
      `${totalErrors.toString().padEnd(10)}` +
      `${(totalDuration / 1000).toFixed(2)}s`
    )

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Migration completed!`)
    console.log(`📊 Success rate: ${((totalImported / totalExported) * 100).toFixed(2)}%`)
    console.log('='.repeat(60) + '\n')
  }

  async verify() {
    console.log('\n🔍 Verifying migration...\n')

    for (const table of MIGRATION_ORDER) {
      try {
        const [oldCount, newCount] = await Promise.all([
          this.oldClient.from(table).select('*', { count: 'exact', head: true }),
          this.newClient.from(table).select('*', { count: 'exact', head: true }),
        ])

        const old = oldCount.count || 0
        const new_ = newCount.count || 0

        if (old === new_) {
          console.log(`✅ ${table}: ${old} records (match)`)
        } else {
          console.log(`⚠️  ${table}: Old=${old}, New=${new_} (mismatch)`)
        }
      } catch (error) {
        console.log(`❌ ${table}: Verification failed - ${error.message}`)
      }
    }
  }
}

async function main() {
  const oldUrl = process.env.OLD_SUPABASE_URL
  const oldKey = process.env.OLD_SUPABASE_KEY || process.env.OLD_SUPABASE_ANON_KEY
  const newUrl = process.env.NEW_SUPABASE_URL
  const newKey = process.env.NEW_SUPABASE_KEY || process.env.NEW_SUPABASE_ANON_KEY

  if (!oldUrl || !oldKey || !newUrl || !newKey) {
    console.error('❌ Missing required environment variables:')
    console.error('   OLD_SUPABASE_URL - Old Supabase project URL')
    console.error('   OLD_SUPABASE_KEY - Old Supabase anon/service key')
    console.error('   NEW_SUPABASE_URL - New Supabase project URL')
    console.error('   NEW_SUPABASE_KEY - New Supabase anon/service key')
    console.error('\nExample:')
    console.error('   OLD_SUPABASE_URL=https://xxx.supabase.co OLD_SUPABASE_KEY=xxx \\')
    console.error('   NEW_SUPABASE_URL=https://yyy.supabase.co NEW_SUPABASE_KEY=yyy \\')
    console.error('   node scripts/migrate-supabase-data.js')
    process.exit(1)
  }

  const migrator = new SupabaseMigrator(oldUrl, oldKey, newUrl, newKey)

  try {
    await migrator.migrateAll()
    await migrator.verify()
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { SupabaseMigrator }
