// // type ExtractKeys<S extends string> = S extends `${infer _Start}{${infer Key}}${infer Rest}` ? Key | ExtractKeys<Rest> : never;
// //
// // type NestedKeysToObj<T extends string> = T extends `${infer First}.${infer Rest}` ? { [K in First]: NestedKeysToObj<Rest> } : { [K in T]: string };
// //
// // type Merge<A, B> = {
// // 	[K in keyof A | keyof B]: K extends keyof B ? B[K] : K extends keyof A ? A[K] : never;
// // };
// //
// // type Flatten<T> = {
// // 	[K in keyof T]: T[K] extends object ? Flatten<T[K]> : T[K];
// // };
// //
// // type ExtractNestedObj<S extends string> = Flatten<
// // 	ExtractKeys<S> extends infer K ? (K extends string ? Merge<{}, NestedKeysToObj<K>> : never) : never
// // >;
// //
// // function replacePlaceholders<S extends string>(str: S, obj: ExtractNestedObj<S>): string {
// // 	return str.replace(/{(.*?)}/g, (match, key) => {
// // 		const keys = key.split('.');
// // 		let value: any = obj;
// // 		for (const k of keys) {
// // 			value = value?.[k];
// // 		}
// // 		return value || '';
// // 	});
// // }
// //
// // // Example usage
// // const str = 'Hello {profile.name}, welcome to {location.city}';
// //
// // const result = replacePlaceholders(str, { location: { city: 'asd' } });
// //
// // console.log(result); // Output: "Hello John, welcome to New York"
//  // 'as const' to preserve literal types
//  type ExtractKeys<S extends string> = S extends `${infer _Start}{${infer Key}}${infer Rest}` ? Key | ExtractKeys<Rest> : never;
// 
//  type NestedKeysToObj<T extends string> = T extends `${infer First}.${infer Rest}` ? { [K in First]: NestedKeysToObj<Rest> } : { [K in T]: string };
//  
//  type Merge<A, B> = {
// 	 [K in keyof A | keyof B]: K extends keyof B ? B[K] : K extends keyof A ? A[K] : never;
//  };
//  
//  type Flatten<T> = {
// 	 [K in keyof T]: T[K] extends object ? Flatten<T[K]> : T[K];
//  };
//  
//  type ExtractNestedObj<S extends string> = Flatten<
// 	 ExtractKeys<S> extends infer K ? (K extends string ? Merge<{}, NestedKeysToObj<K>> : never) : never
//  >;
//  
//  type ExtractTemplateKeys<T extends object> = {
// 	 [K in keyof T]: T[K] extends string ? ExtractNestedObj<T[K]> : T[K] extends object ? ExtractTemplateKeys<T[K]> : never;
//  };
//  
//  type M<T> = {
// 	 [K in keyof T]: T[K] extends object ? (T[K] extends infer U ? (U extends object ? U : never) : never) : never;
//  }[keyof T];
//  
//  function replacePlaceholders<S extends string>(str: S, obj: ExtractNestedObj<S>): string {
// 	 return str.replace(/{(.*?)}/g, (match, key) => {
// 		 const keys = key.split('.');
// 		 let value: any = obj;
// 		 for (const k of keys) {
// 			 value = value?.[k];
// 		 }
// 		 return value || '';
// 	 });
//  }
//  function getTemp<T extends keyof typeof templates, V extends ExtractTemplateKeys<(typeof templates)[T]>>(
// 	 templateKey: T,
// 	 values: V
//  ): Record<keyof (typeof templates)[T], string> {
// 	 const template = templates[templateKey];
// 	 const result: Record<string, string> = {};
//  
// 	 for (const key in template) {
// 		 const value = template[key];
// 		 if (typeof value === 'string') {
// 			 result[key] = replacePlaceholders(value, values);
// 		 } else if (Array.isArray(value)) {
// 			 result[key] = value.map(item => replacePlaceholders(item, values)).join(', ');
// 		 }
// 	 }
//  
// 	 return result as Record<keyof (typeof templates)[T], string>;
//  }
//  
//  // Templates object
//  const templates = {
// 	 embed1: {
// 		 title: 'Hello {name}',
// 		 description: 'we are {company.name}',
// 		 fields: ["{test}"] as const
// 	 },
// 	 embed2: {
// 		 discord: '{discord}'
// 	 }
//  } as const;
//  
//  // Example usage
//  const result = getTemp('embed1', {
// 	""
//  });
//  
//  console.log(result); // Output: { title: 'Hello John', description: 'we are TechCorp', fields: 'Example' }
//  