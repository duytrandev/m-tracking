/**
 * Nx-specific ESLint configuration
 *
 * Contains module boundary enforcement rules
 */
import nx from '@nx/eslint-plugin'

export const nxPlugin = {
  '@nx': nx,
}

/**
 * Nx module boundary rules
 * Import and customize in your project config
 */
export const moduleBoundaryRules = {
  '@nx/enforce-module-boundaries': [
    'error',
    {
      enforceBuildableLibDependency: true,
      allow: [],
      depConstraints: [
        {
          sourceTag: 'type:app',
          onlyDependOnLibsWithTags: ['type:lib'],
        },
        {
          sourceTag: 'scope:frontend',
          onlyDependOnLibsWithTags: ['scope:frontend', 'scope:shared'],
        },
        {
          sourceTag: 'scope:backend',
          onlyDependOnLibsWithTags: ['scope:backend', 'scope:shared'],
        },
        {
          sourceTag: 'scope:shared',
          onlyDependOnLibsWithTags: ['scope:shared'],
        },
      ],
    },
  ],
}
