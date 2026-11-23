/*
 * The Noir golden (ADR 0010, PRD FR-2): SHA-256 digests of the canonical JSON of resolved Noir and of
 * the brand branch over Noir, generated from `dev` at c0d89a1, before the preset
 * seam commit. NEVER regenerated: a future change to Noir needs its own PR and a new golden,
 * with the reason. Erasable TypeScript with no imports, so Node's type stripping can load it too.
 */

/** The commit the digests were generated on. */
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
export const NOIR_DIGEST = '5e27a35ac2bee79d3af7c6097f7453cfbd693488389827085f7b2a32c4040e01';

/**
 * SHA-256 hex of `canonicalJson(brandPreset('{name}', '{surface}'))`, keyed `name/surface`: every
 * Aura primitive palette with a `500` step on zinc, slate, gray, neutral and stone.
 */
export const BRAND_DIGESTS: Readonly<Record<string, string>> = {
  'emerald/zinc': '8f68ff8a3d10a6e7ca76e886135a874821db7308d2025764df3f5918fbc4fa42',
  'emerald/slate': '29d6553728d874a7849554c7db8d8ab713114ea7ec764c5e04f208bae5b69989',
  'emerald/gray': '50481f005de076201675bbd11430def1d8d2422be11b93cccfbb1e99331293d5',
  'emerald/neutral': 'a4b9916659563445c2a17f5bc124bea41a2348f9e040ee332d5fe9e3ec07dcbd',
  'emerald/stone': '67e6737b7413bc6c2695280d0f5a5660a437fea469568940fd4193477c24b822',
  'green/zinc': '4e80ce402af97afc4b0b3d672bbba7e10d2179ae5892c958c43de40ba0c835b5',
  'green/slate': '8c19b9bc7539a42a831fe28068d40a1ec9e48cfce839da9a23dfe34b10e5593c',
  'green/gray': 'd3da44e3b090d332fb9bbdfecd641588de6056382491b09b7d47ddfdaf3b5c13',
  'green/neutral': '7a0483aa34d963691426bf4dcd6ba9a70bf39c137148b7de4a3117063297fe70',
  'green/stone': '99497bd57fcaf425a2e769a6272d47d1fde9680c8f04b3e1194ca18f4f25c3e3',
  'lime/zinc': '8c7e80aed5725238c3fd27e48362fe25b8f95eadd03b4a55748025975f782ea0',
  'lime/slate': '629d1def9c03d781b8e517572c6ad4e603bc74c3d74369bd8fdb7b5ca0da0f2c',
  'lime/gray': 'c0fb52aad52d30e759aa95c4a604cfe8de3a15897886c0f3167deac709a39408',
  'lime/neutral': '916bd7fc1b6c745dfe1b0403b9bb410de2c38119fb92ee9ae65772f4cb53619d',
  'lime/stone': '1757e6d71eb4da34442902a5711d8f7f05c2bb2299419b3b6131c6ec85946069',
  'red/zinc': 'cf7e8aac105d1627919d3be42b892f4ff728bbe0485d4c553895dea1f32cfce1',
  'red/slate': '88a9336678ea6eafb5c4f84106f47172070123fd95d6d00305b5b9c63af1c1c9',
  'red/gray': '4be85c22f18ab1da66f44b93f4cc68577f20ef05a807061d8c5cb922f429ae88',
  'red/neutral': '8492ec5c44943e54c707aba15a6d2d8040ad28986e8c10740cf38e0e8b80bbaa',
  'red/stone': '51b8982824a9acfb10612fe2db4a1e56b45caa04c5f6c28450da8785e62774d2',
  'orange/zinc': 'db1376aa3d785ff7385191e13fb5da25279863a1975082513e176549ad4915f0',
  'orange/slate': '23d45a1e29d4e32f7441044d837d1a349da9a5014bf6d053d88dfdee385f0f25',
  'orange/gray': '9260bfe033599a134de9c0dc901c1dd1d68fe74cf7300c0b26153fbf94f7d73a',
  'orange/neutral': '6d66a5a30a71484b9ded141d6b3096aed1c1fab151631c00c626d9622579e343',
  'orange/stone': '19189c3c64a14b7e305aeecf5b152e510a0fda5268fc7df6f99eb2a28b39cfff',
  'amber/zinc': 'e38558e0c5922822939e4a3ebe7074fc928d41ec98819afbac4e402c6f1734dd',
  'amber/slate': 'b50efc150f60371f978f3fca682c1facb4a7e372782848a463affe84268d521b',
  'amber/gray': '18a655eb5a15453ecf88f393d577dc577b2f305cee9c6348a6f131d5ba4a9907',
  'amber/neutral': '13c9075c279c3356fb9cc792097be3a606a334abffb8d5c17c0bcdf721853b3f',
  'amber/stone': '0938f0d55a615b7e052518b7a71c7adb9d137b50084f71fa413bf830ae3e59fb',
  'yellow/zinc': '5bd36d799bca11915306307d7647f9d307662aaa02accee764a611a1bd3b42f1',
  'yellow/slate': 'c27efba86541df3b9726371571f97f733c65720f0b3e0b87cf483fe74421cbcb',
  'yellow/gray': '7d82ce12bb8df803a45fac438a0d03aa0e92bbcf36185c6c070b4307db9fde23',
  'yellow/neutral': 'f9962bc4cfa05f261fcc01daf82f40cb29672a961426ff68e40f30de680e89b8',
  'yellow/stone': '077b81c45c15ac20534dd39098248584aaf0bb0ef998bb9cf49034551c395c40',
  'teal/zinc': '388f84de7eab2db11a312e092b9493b04fef628c0408d8288ac1f6269eaa2331',
  'teal/slate': '424aee9a2ef64c73a1f2d302cfc37ab09ca431cf9fd531af0be4eb3b84326de5',
  'teal/gray': '48b4a946a8987fea18a4730b7743c2760b4951086bcb094c2452def1ef5756de',
  'teal/neutral': '69517c8f882c4dbf4427db9f1436a068961def7e57acf351f33c1f9a8b5f6154',
  'teal/stone': '52090724e238677ce35d466bfdfd2f2550738ed72380b0a6f240221a9a9a1d77',
  'cyan/zinc': '7be994f695765f95a18c8925ad1ef2942e9d0eb783d8373f0d1042f10c467169',
  'cyan/slate': 'd683a6f1cc134ddffa92cad939e2726e2ffcbec9d29e5ce529a1679717e8e7ef',
  'cyan/gray': '320b6ba1ff71f75fce9e84a02ef839485e82d66c77aa664af60ef4e6517677e3',
  'cyan/neutral': '5037d18f74ee291dfd210a91624ab4f81b430db52aa80445ee026ac9044ce11a',
  'cyan/stone': 'da665f267af6156703c636b43e81e6fbd8e6e59e1c5c766616a4ad38fd08ea75',
  'sky/zinc': '0e125c4fd5f2afd4dcf61c957247ae1ce58b0cdf375d50d56a19541adc5bbee2',
  'sky/slate': '41add83c60dd87f7bd3302693edd2a73b301c8dee4877314cea1b3ecf9266bab',
  'sky/gray': 'c7f90ca897db0779eab5563877a988a75052adff0afd7638e49b4a2837e5be26',
  'sky/neutral': '791585d86c632da4f4ba89a39ca5d9d4c17207fc4f596df8ea7b7701f1570bdc',
  'sky/stone': 'd5a7e09b663c096e725bc99ef794861318d7f1dce27d12b9f3f69683e59ce149',
  'blue/zinc': 'e3f59e76b25a84601620d2d1a247606ccffec8027fad0dfd5033e3cc6f9dff22',
  'blue/slate': '24fc0eb561e3dbfc3682c0c6e2af35f92f5dc91f18be9b3fb8451f5edb58b12a',
  'blue/gray': '7de14236f5ce0bb8a5b17636b33255b5cd661034c2862ad79ab6a42f66ab52dd',
  'blue/neutral': 'ea10618786888df34000d03ea37c857b355e0c025e496f3e022f73ba42facc77',
  'blue/stone': '81cb4ca07f82f9d95f4252f14be28aed8c7c845eb1d2b1517fb17737bcac7e79',
  'indigo/zinc': 'e6537db3501decd46f05a98ffd3e06a94782140870c878312944770d22154608',
  'indigo/slate': 'f01c6575a76d4eff6eabc331389a889cdf460bb3f9f82d59538a801eef6dd13d',
  'indigo/gray': '8da7c864ada7ab7fdcac0540f14fe73d92dbf1b7565b7cc9a40bd6eb76a80bc9',
  'indigo/neutral': '94e0705b94504c71e2b9652919fbe1a6206d203ae310fac79f8f8130e530c272',
  'indigo/stone': 'd6fcdc9e4583ee7f253384f20ba90849777bdc402779b12e04fe361765ec529e',
  'violet/zinc': '52bf1b6ca0d4c7a6d74bb402146637689619e3f834df46eb5d636310594e95b7',
  'violet/slate': '826927c9b0ecd6aef3b57d59d9ce37dddc18cab0151741c2eb72ea1e6f7b14ab',
  'violet/gray': '30782ae9215a48aefd675f5b2ff442cc92d630b35ba51a8cc722f2bb4e30e7bb',
  'violet/neutral': 'f815f316edde03ba9ae4a15c78db3e4977f1c091d31c5c3436417df5bb736315',
  'violet/stone': '14ceefd856aee016b4eb713fa03eef5f9ecca25e786e85e085d360d8f38fea8f',
  'purple/zinc': 'aeaa1eda95a256eea58d2ad81a6cdd3b401f213fcdfc123e35b92c50931f6aea',
  'purple/slate': '0ac4c6d20b86f501ae28fc2f9333dac66631e07c8638c65b03bd026f464a7cc6',
  'purple/gray': '218958e5cfaf3d6c8bcfa8daa6f90c51c97d82f8bfce91db067403d9c2487894',
  'purple/neutral': '6ca16af14a1b8bad59cb57b661554b5b9056885cafb972ef3193858207ac9686',
  'purple/stone': 'ac22ba4b0c98b46c699f8cc8e06542b1dca2ea8bf703d00fd2ddb824584bd7f1',
  'fuchsia/zinc': '5c85a69708e4d1b821994b997392302a63be0656211a5154844fe9c933486e96',
  'fuchsia/slate': '0fd6701af65311daff705e9dc98023a319010b72a04147ff2a6e30d12c3db2f0',
  'fuchsia/gray': 'b2ddae11ee69816043aa1c43c0192065602c0441ddac85dac033e2abff12e134',
  'fuchsia/neutral': '1b898ca18408702b25f0c474f6e12f25798a3af541b12182e4d27cfde7dd8f1a',
  'fuchsia/stone': 'e98c0ce9938520642242ecb55eae852dd091f7e03061cabdc14d972a9dbce26c',
  'pink/zinc': '8645c0b3811b87c1fae6539884eaf1113c42957d9f1b7665e857994a5798aac0',
  'pink/slate': '2fdac22f1560a8fbc8394a46d8e867df48403c620981b72e4d697d270e6a2824',
  'pink/gray': '8b2b2493ca3df457f4a3b1c94e1cd0f89cd24bf88ebb80be322f1c511f5d6885',
  'pink/neutral': '1651625ff5752bc48ad5c9880d69acec416ca9f6a1035ef2f43b8cbe04d5d4b8',
  'pink/stone': '135d27b69e8b7497de8855b3e1d4c3a635762d345efce98e0b4207997286b69c',
  'rose/zinc': 'ec237707c96b1611a8352dff7ee725a93b3a9e1649269ec57323905001fbe2ca',
  'rose/slate': '44cc8d4b9a3e0254d5799ae821832586036516a16a69efb40b2daf75095ed50b',
  'rose/gray': '268e9b37a6258469c5b3f724f8dc46defb91e607ffed0aebad539452340d4e9d',
  'rose/neutral': '819548d19ff5948fc7e19475ffafc0e98ba2d3076b43162c7707c0f8a06fe0dd',
  'rose/stone': '10bc823c22d1380f098bbefd5c23d89f711f957be062b41ed8023e6088d5f5c3',
  'slate/zinc': '1f0ee3ba3344bb4ce3fc0212102e94224c2e1639536ea04bcf139b52dc3a3d42',
  'slate/slate': '98830d83e4d72b5ac1c6b899bbcf73d66e9b0faa7380bf3b4461c96dc094e210',
  'slate/gray': 'c17126a6a5d30844f518dfd54213b24ffa8833ee56fb5d15087fce08589a6997',
  'slate/neutral': '434bdfb3afc36f47b7ac545718b2bc121bb72553a36181546730058983027ab0',
  'slate/stone': 'f4919fd92e33d4cc42e9fa108514ac11263de66eec6c7e722b9f132fec023d52',
  'gray/zinc': '16f02768885462c5c68480ed3b0bd2f7ff17b5ebfa115e7f6aad7948f176c012',
  'gray/slate': '0780629038cded369990217217045ce1e42325fc21a814520c086e286567d7e9',
  'gray/gray': 'bb13c95fb383a27d5c3bb1bb650c27d540ffbb12315ca829bdf9a19d1e32ee90',
  'gray/neutral': 'c3f7c169a0ec4eeba1e13950c5183a1d75f2f3a3c7414c08b58ac0ae5ba9768c',
  'gray/stone': '6cbd15636a9c6278c5aa827f0496f175fdbed56b200c17e4ec1b766d519e2678',
  'zinc/zinc': 'b2649a2dc657f9538df1ac70bef9854ad03840b6406208d68fcd158a5cde3d52',
  'zinc/slate': '93375c738740adce6b63b736e4bd4617bc64db2eab567416866218b29ea2a896',
  'zinc/gray': '47f40a3bd33d7b7a83ef6d044139b55adbc3e0ec228a234a1f5f32dec060a1d2',
  'zinc/neutral': '2fc99a493ed126968444fe64a158eb71f6f6a03e1b01da461a81a4277468ee70',
  'zinc/stone': 'f79f64ab32819a967725f8210b6bd1adb426f8e56320d20050c5844f36b949a9',
  'neutral/zinc': 'ff95340ae04c40d79545537b750ff6b544eadd47af6cc47305a0f4adf904ffde',
  'neutral/slate': 'bfe3f2e5fe4a992920cc5399f8ed7368929f501eb3a867f2e36d3c079b66072d',
  'neutral/gray': '6778fa8f5ef718bfae6979d92b5f47e11c924af6d0ae143995553bb313125966',
  'neutral/neutral': '509f53459e846b86f2f81c71655ca1c84c22ab6896991a5cf81ca3a4f38312d3',
  'neutral/stone': 'b9cd6bde38638ef8395ff345b98baf8546f03ccaa2085eaa48f8f1b046e16f2d',
  'stone/zinc': '0c54e3f01fcbc6f7f5ad648c4aa7f1eb1de0db1cf3114e2f899547805f50f840',
  'stone/slate': '27122bd4bf4a628b73952c430dbc0ea39ccaa0e19b09b34a462e15d32f2db1f6',
  'stone/gray': '682ca8497ac76357c2e0600d01fe360e2c1c0823b1f3b3db179d8e3058d1933a',
  'stone/neutral': '8c79eb2e172bb0b69a3d8773255aa1f3ba8d93712fb46a2ce900b3012cb003cb',
  'stone/stone': 'f7f1851b44034a94dc294db75fc8518409dae8f4ab0927ed4d0c8778bce759aa',
};
