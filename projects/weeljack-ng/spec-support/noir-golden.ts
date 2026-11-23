/*
 * The Noir golden (ADR 0010, PRD FR-2): SHA-256 digests of the canonical JSON of resolved Noir and of
 * the brand branch over Noir, generated from `dev` at c0d89a1, before the preset
 * seam commit. NEVER regenerated: a future change to Noir needs its own PR and a new golden,
 * with the reason. Erasable TypeScript with no imports, so Node's type stripping can load it too.
 *
 * New golden, 2026-11-23, in the fix "the focused float label passes 4.5:1 on every preset":
 * `wjGuarantees` sets `semantic.formField.floatLabelFocusColor: '{primary.hover.color}'` (Aura's
 * light `{primary.600}` failed 4.5:1 under a coloured primary). Every one of the 111 digests was
 * checked to equal the old one once that single key is removed from the resolved preset, so the
 * change to Noir and the brand branch over Noir is that key and nothing else.
 */

/** The commit the original digests were generated on (the 2026-11-23 golden adds one key, above). */
export const GOLDEN_BASE_SHA = 'c0d89a101c23960860c0d52282526b44ac3a1fab';

/** JSON with every object's keys sorted at every level and arrays in order. */
export function canonicalJson(value: unknown): string {
  return stringify(value) ?? 'null';
}

function stringify(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stringify(item) ?? 'null').join(',')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    const parts: string[] = [];
    for (const key of Object.keys(record).sort()) {
      const text = stringify(record[key]);
      if (text !== undefined) {
        parts.push(`${JSON.stringify(key)}:${text}`);
      }
    }
    return `{${parts.join(',')}}`;
  }
  return JSON.stringify(value);
}

/** SHA-256 hex of `canonicalJson(brandPreset(undefined, undefined))`: Noir, the default look. */
export const NOIR_DIGEST = '4bcd0c10e3a56fdca47e44e00c60a2d27368089112a331d09c3d51170faea639';

/**
 * SHA-256 hex of `canonicalJson(brandPreset('{name}', '{surface}'))`, keyed `name/surface`: every
 * Aura primitive palette with a `500` step on zinc, slate, gray, neutral and stone.
 */
export const BRAND_DIGESTS: Readonly<Record<string, string>> = {
  'emerald/zinc': '8adb0e675f363e1cb940456928eab372dfe5bdedd759bae2822711539e372949',
  'emerald/slate': '06c7e8e7b6e3a194cc101409e4d0fc710b8b0d7530a02511381f952bc7744c92',
  'emerald/gray': 'd4d09cdb1753a9ec5ba60668f9b091196aa1f80aae3c5f6fc137a5786d3bf324',
  'emerald/neutral': 'b754faf871054a86f200356b46a29e4d2834090c4137f9523ee191f707d477e0',
  'emerald/stone': 'e4049a7d134919ad4fc66e82a844cf5eeda2a536841e1276f80d6e3cd5e75803',
  'green/zinc': '31697f26214039938af1df4f784f9687edac74815e335e5ad12ab784f2f121fd',
  'green/slate': '4184c69750d49c9343ac90591548e680eec7e58afe3bd2195cc3dc3460e0d726',
  'green/gray': '4f99091d29d344384df237fc1b79fe8c25fcad2783e8318c7d4efb4c7daca0fe',
  'green/neutral': 'c08a3b44b05f021f564dcf1e52fe2560764092d47ca5ba19c1084fe48c8fc3d5',
  'green/stone': '587edcf948c251a306b7c8a6d71916b732af1510a3efcb0c3154d302125cee95',
  'lime/zinc': '6f7c5d7d5b8270e93cdcf9afb66085717c67adeb772ed9c61c3735831cc52ab1',
  'lime/slate': '65b0cc2fab57de422105d5b96c5243b7ebf78c7f5bb7848c4a2b577d6a7f78a7',
  'lime/gray': '2b7a3dc0c32fcf12e3ca635b349d5e750fd2d15524f63ebf82bad2d482b2460c',
  'lime/neutral': 'ca158367cf412aff81c49f1d8b923bfee3ddaedae63def97fc30d6e722bcb5e7',
  'lime/stone': '6cedba5a0d9989dbfdcae3cd3f31e813f5b8767c7af2f9ce5db0ba2f29773eba',
  'red/zinc': '50534281a37773737aa2cd527e793c5a1447fb8a4f2cf0d2350608c54e3e22f0',
  'red/slate': '777f657a128c8cec072c5192a7d7be2f5ce49fa68744bdae4190fd626878d33b',
  'red/gray': 'fba33959be5802a81327dd9c56a1bec72420bb2539705729fdfbb4f62749ff32',
  'red/neutral': '386b64fdca4867a347ca9389c0cffd10f1ac85d74609b37c06cbfb90e2ef943a',
  'red/stone': 'c4169db7a4ffdb1441ffb7e68b77ee6dfb749d11604b4b831cf0e6838710af62',
  'orange/zinc': '77e823ce8c0fba451034c654665e553d5d0d87e031905a5e3abab69e6f61d5fa',
  'orange/slate': 'd75c99410fe2eb8fa60fc5daa62f05d9b70499cd79e2ef97a7e0181df35c349a',
  'orange/gray': 'f719023d5308609ee8935eb721eee89c826a7d153d50e77f2d7729c559d6677c',
  'orange/neutral': '04c300fe2e2d8eca8d0530883b67e5084630a7457f6d86f67fbebde9fc5ee96c',
  'orange/stone': '3d65ba21405e3d996530bc41aa292cc60ce8b6f530488ee30834a092f4005f81',
  'amber/zinc': '4a129f95cf67a3113624858c006bcc6c47b353989d24e77e524d53979189aa91',
  'amber/slate': 'ed6fcc4d6b6bd006f74f9a127f3a28a6d04dcaa26bfe015ffdaaca03dc47c218',
  'amber/gray': 'e760c6e3c219779eee02c9a14ed07d5cb2678bad206bfaeb2e7a703adef15629',
  'amber/neutral': '7ca6084d8e60a54085f02d1a216b004d4eda31a0f108e70321f7f43cac3127e0',
  'amber/stone': '256503e6b2d080d1d3c5b1018e5938954b27b49849ec4236c49175552431e03e',
  'yellow/zinc': '50dbfccd07e9d7986671ab700bb3e2cec41f44831300052ed99d2ae22264823d',
  'yellow/slate': '6adf4a58e662033abbf5b42783ed15fc71c5bd8a426e8cff771f4af83a6a3b25',
  'yellow/gray': 'ab6ec05e1d5c141e79239815668f6321c069f08b50c9741c5dee720bb5ab44f1',
  'yellow/neutral': '0189f9035243487e20ef5310dab4d113a2f9b3949832cee4305a9984d7a8dc9c',
  'yellow/stone': 'faec68cc4aa2283e83f43238be337211459990cdfbfa5f1fedb08c61acd2162b',
  'teal/zinc': 'd096d8cc3645575e074365483c3e9c118f76cfc38231165a3b19513a0f73014e',
  'teal/slate': 'ba4f8b78b03206fa39968fe8e87b740e91877234ea27229df1672a95f4945ba3',
  'teal/gray': '79c86fae13fd63b5e778a08f8f3dde0e6a5cf33e19323d550ee3e94883ad566d',
  'teal/neutral': 'f621b5b1e1bafaa22386c99daab3b4b92ce79508de95ed66df3dd5c8242c96f2',
  'teal/stone': 'a048593df2e4ad261670bc4d5bfbb0ac1b3a0a9ffd205ec0b42cc7d7a10eab8d',
  'cyan/zinc': '234e12db8b4d7fab475bf15d44033ec3f39cd6a38542d38a3c378167be2c058c',
  'cyan/slate': '2f138fc48ea5247d8529f163afe919626b31b2e627b6ce07a2bb7044c1b02bf3',
  'cyan/gray': '540c1b03129e05c60b3d6a4f5f16a72b2af0a82fe5dc5afe8f72cfe0479799b7',
  'cyan/neutral': '5f9a717dbb401cc8fee6dca4a1075a5c3e09737b1de66cc08e8276fc04aa13ff',
  'cyan/stone': '1ce6840d8fb3bf0d000ec5a86c0ef57bf1978e4bd918877383151cc80e6e8c34',
  'sky/zinc': '29f20de28fec227b05b247f7f1b7ac8e4066a960ecba494f7f475a25444cc9b8',
  'sky/slate': '588ffe0a329c5ef6eb6462ec564247caf5da7aa9a748a6bf976a7e87b9ac03e5',
  'sky/gray': 'b4ae5f939faced8265613141292952d6d7f191c4680d539e9b45480bf3a99b7d',
  'sky/neutral': '2e778cde73cb3f4b0cfe0a455b9e1eeda365e8ecb82f725889db89588f5be03a',
  'sky/stone': '38258d887651d9d049c4c2c7b92a7802596c60f2677cd6a11ce40e9761032bf7',
  'blue/zinc': 'ea8268be34d2f070daf56580ea162f873d3a67d5aa1008a9c8881a3d8a93437b',
  'blue/slate': '1a5a9cb54229facb0cd0cec3ebb4e01778702daf192cfbeff9d559ad34ac7538',
  'blue/gray': '0331b3e9102c52baec1f13621401ea9e9babb9060914d34a89570cc933d938ba',
  'blue/neutral': '10e498d4e00609ac6609c9636bbee8ea8adf8de6b962c6c01793b67b0eec7d5a',
  'blue/stone': 'b368967bf13df61c8287effd29cdfa9fcde70317590fb7521b12ad49d6786bed',
  'indigo/zinc': '96ce5b07a405071d582cc66f75c34ff07162177ced958b8df7c0434d5e385402',
  'indigo/slate': 'be89ef6cc567871212a4602fa3abac0d667c7edad4039955241149a4d6f732dc',
  'indigo/gray': 'f7f25a266735c5378f8c8bc7a9233a69e9af826dfb58f0f8447659b840967c1d',
  'indigo/neutral': 'b8d675858b021c56bde58cbcdea4e6f90d8dc2aed68cdcdfecebc1268aa8eb55',
  'indigo/stone': '7f6d8954aedc4626eb53191f3022a62a3eb43b2b4d0328380aa2e77c749eab0e',
  'violet/zinc': '18a983991b2e7664545f34f2da71739c4e8180d41d9a60e548902c6d152caf5d',
  'violet/slate': 'f6776ba8018a8b867b31f60488ad3e0826ef5fc52f3d164f57a8d861c66c2bb4',
  'violet/gray': '754d65bd42f2dd457a85a948aa0ff82972db2bdf7732dccda05f63f8ce7e301e',
  'violet/neutral': '30b85199ee3e9e81d902042100d8ff3e966f497e36bbfb7bccb5f6d80a12096f',
  'violet/stone': 'adf65a2ea32312791e0dc015e0e88d72765ec174b76303dbeffdeeed36f36200',
  'purple/zinc': 'aefe1cf11f22b0284034d3baf18889301fa0309207e57cdb42f0ad6709eb5257',
  'purple/slate': '76766c2cf9b5b935a0e3b5cde74a30d07d0d72c5bdb49fbc751b16b66fc0ee16',
  'purple/gray': '2bbb2329858d8a2bd2705e3b6831d7ed6e604dab8ec06ea1525375fb2175d1b4',
  'purple/neutral': '94bff3bcbc198a37d07308148d02042609b914bebaeeca0ce0adf5df400f0ed4',
  'purple/stone': '1e3e6f8f04aa141ce930074ab5db2e7768c1ead99d5fa90f0ab80827107b5e5f',
  'fuchsia/zinc': 'c712da7e7bc7d890fdfcb661001a68fc7c7a569174887eecea25aafc1d1871b1',
  'fuchsia/slate': 'cf86ecd4039607cd3f037b689602a23d2dbc2d9582e6a3b5fdb15d16b208eee1',
  'fuchsia/gray': '500bc69131a6c86513afbe3c1ab4e42d804a2bc7b017a5d2d8eaa77719c0f445',
  'fuchsia/neutral': '536d9021f5f8fae2eccae5dc811044a5316c49178bfd66817ace105128212b34',
  'fuchsia/stone': '8422d649ac97bc9e5b5400e564ff4cde8e08f0156c1345fcc9cdf9913ef39364',
  'pink/zinc': 'e345960cd44ffcfd43d8dd0f3bb811e6deeb7cbfcad316165f80399c2b5e5784',
  'pink/slate': '2f323ad024f421d98ee2b85269d7bf64290484a981cb5ff15427a68e43944a73',
  'pink/gray': '3f8de1fd393cdeff298a134e1ef32db1f9db21eca19cde508eaeb40689f8e984',
  'pink/neutral': '3887328d5d20f74b5ba675f4fd9ff2fdda7373ff4258c477b2c6eff20d6fa74a',
  'pink/stone': 'da7e13859ecfa6d90979e414eef69e076ec7b4950a1d006144e0e059bfcfca72',
  'rose/zinc': '811d7ed19752bc57a79b9f5c7f001310b29fb27a622ea50924d913a14710bcb6',
  'rose/slate': 'b102ccdaa422dfec105abfc297cfd4441c73bba5c3526328434f8e2389ead9f7',
  'rose/gray': 'bfcec905b8df8e7fff447a53668d67da84e7e163171b7d2b255f331f0072aeff',
  'rose/neutral': '1a8fb6da728db900ea4c7ff4de461d9a8991c4bd54ddbd894104f9f533157b29',
  'rose/stone': '95ef40aaa2fa4be22c2d96c420fbe9fd50c23c0ed2f08f2e9db7782c07807817',
  'slate/zinc': 'daecc33d7476ee3f2785e62b477cf4c87642147c32c329fc6ee2a9c0560dcbfb',
  'slate/slate': '81c1781dd75471bff414ed5dd782e975ee21d59b6344974eeded2258588a772d',
  'slate/gray': 'fa7c05d99a4bac8d39f4c5df62aa6010c2c94baab1c58dc34122f9917ebc82db',
  'slate/neutral': '405b5830ee6d96ab326a060d6e1ddbeb403e511d9e831cd13d32c388b1ed291f',
  'slate/stone': 'deca74fed5f0cfb87b420b8a175104028ba06aa4605ab3caf45acdc2601310db',
  'gray/zinc': '7ea3995b7b6e8d5ae1c668d05c5bb55a8da735ceccef0726abffdaf6dc30b3f8',
  'gray/slate': '6b5c8b6bf432cfa8bfefee6d5cc4bc8b8734b5bd94ead8ea61ba4d93d644c734',
  'gray/gray': '9d1e7367ab78cea66ec56ba00c8d906e872af7311ed7d78033236b8ab42306c0',
  'gray/neutral': '4abc38ddf8bbccf747ebae0a9c44add14d53402f092952136ea666da07e6a9f7',
  'gray/stone': '94c45963e84757a5866169f4cfb6290d1eba7bd8cfaf22012792b22ece4efab0',
  'zinc/zinc': 'c775acd569d843ec70d0e7ea37fb5053b87eda9f27f98cab4ff8c8e513e3abac',
  'zinc/slate': '46cc3afd66964b81c87ead896e9efaa81555cd2916ea54e18d3d36c291acb4ae',
  'zinc/gray': '90bb3a8272414d250ee4ff8ff89557fb027003d2ea42662740d5c26049a7c6b0',
  'zinc/neutral': '752bacd55c259682bbad591c063cd8574091ccec8fcc30f55bb6c11db50d2d6b',
  'zinc/stone': 'df32a9cfa2d00b28bb61227fd532662825c2c5d60b0ff33fa90c5813e93f35e6',
  'neutral/zinc': '59218e07ee840a013749299a1b02bd4347bc20dac0b92a208b7e936d57addb79',
  'neutral/slate': '188008c641a7a456a5e120a3bcafa52cc410ff81e488de18c456cc1e37440aab',
  'neutral/gray': 'a83337774dcf3da17d69fca5fff033834df3f57d91c8e3f59d1e672add18f875',
  'neutral/neutral': '7509b6595989d106c2fd975e22af66674914e8a6a6282c06227276f0fdd91f26',
  'neutral/stone': '71d99f5dcb6b44cf8daa97dbade84bdd7f256e3264387fcac6f2d581db78de78',
  'stone/zinc': '3a4df99c9c73153cc70d6f36946e152854581a60988846689948783e975fb535',
  'stone/slate': '06549681c6a2c4bc95e17e258a99507d0fd7be764865dccffb5ca60a580742e7',
  'stone/gray': '9f6d3d64d6658a63fc82b96073b7651de05b7719366c3774f201ca8b003f348a',
  'stone/neutral': '4733f07bd9864a780ffbf9e06b99c76e3550ff05652855e10974d4678a478f48',
  'stone/stone': '26e856b93c004339a1299dbec9bbbe1de823f9590d3d7e6e56812e2a295a4bc9',
};
