/**
 * Le menu debug n'existe que dans les dev builds (__DEV__) ou quand
 * EXPO_PUBLIC_DEBUG_MENU=1 est injecté (utile sur un build preview interne).
 * Les profils EAS de production ne définissent jamais cette variable.
 */
export const debugMenuEnabled: boolean = __DEV__ || process.env.EXPO_PUBLIC_DEBUG_MENU === '1';
