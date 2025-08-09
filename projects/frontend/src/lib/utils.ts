/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ClassValue, clsx } from "clsx";
import type { Action } from "svelte/action";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const scrollToBottom: Action<HTMLElement, unknown> = (node) => {
	const scroll = () => node.scroll({
		top: node.scrollHeight,
		behavior: 'smooth',
	});
	scroll();

	return { update: scroll }
};

interface DebouncedFunction<
	F extends (...args: any[]) => any,
	R = ReturnType<F>
> {
	(...args: Parameters<F>): Promise<R>;
	cancel(): void;
	flush(): Promise<R | undefined>;
	setDuration(newDuration: number): void;
	isPending(): boolean;
}

export function debounce<F extends (...args: any[]) => any>(
	func: F,
	initialDuration: number
): DebouncedFunction<F> {
	let timerId: ReturnType<typeof setTimeout> | undefined;
	let currentDuration = initialDuration;

	let lastArgs: Parameters<F> | undefined;
	let lastThis: any;

	// Promise'i yönetmek için
	let activePromise: Promise<ReturnType<F>> | undefined;
	let activeResolve:
		| ((value: ReturnType<F> | PromiseLike<ReturnType<F>>) => void)
		| undefined;
	let activeReject: ((reason?: any) => void) | undefined;

	const createNewPromise = () => {
		activePromise = new Promise<ReturnType<F>>((resolve, reject) => {
			activeResolve = resolve;
			activeReject = reject;
		});
	};

	const clearPending = (rejectReason?: any) => {
		if (timerId) {
			clearTimeout(timerId);
			timerId = undefined;
		}
		if (activeReject) {
			if (rejectReason) {
				activeReject(rejectReason);
			} else {
				// Eğer özel bir sebep yoksa, sadece promise'i "boş" bırakabiliriz
				// ya da varsayılan bir hata ile reddedebiliriz.
				// Şimdilik, flush edilmediği veya iptal edilmediği sürece
				// promise'in çözülmesini bekleyelim.
			}
		}
		// Promise'i ve callback'lerini bir sonraki çağrı için sıfırla
		// activePromise = undefined; // Bunu hemen sıfırlamak yerine, flush/cancel karar versin
		// activeResolve = undefined;
		// activeReject = undefined;
	};

	const execute = () => {
		if (!lastArgs || !activeResolve || !activeReject) {
			// Bu durum normalde oluşmamalı, ama güvenlik için
			if (activeReject) {
				activeReject(
					new Error("Debounce execution error: missing context.")
				);
			}
			resetPromiseState();
			return;
		}

		try {
			const result = func.apply(lastThis, lastArgs);
			activeResolve(result);
		} catch (error) {
			activeReject(error);
		} finally {
			// Yürütme sonrası temizlik
			timerId = undefined;
			// lastArgs ve lastThis'i burada temizlemeyelim, flush tekrar kullanabilir.
			// Promise çözüldüğü/reddedildiği için, bir sonraki çağrı yeni bir promise oluşturmalı.
			resetPromiseStateAfterExecution();
		}
	};

	const resetPromiseState = () => {
		activePromise = undefined;
		activeResolve = undefined;
		activeReject = undefined;
		lastArgs = undefined; // Bir sonraki çağrı için argümanları sıfırla
		// lastThis = undefined; // lastThis'i de sıfırlayabiliriz
	};

	const resetPromiseStateAfterExecution = () => {
		// Sadece promise ile ilgili olanları sıfırla, lastArgs flush için kalabilir
		activePromise = undefined;
		activeResolve = undefined;
		activeReject = undefined;
	};

	const debouncedFunc = function (
		this: any,
		...args: Parameters<F>
	): Promise<ReturnType<F>> {
		lastArgs = args;
		lastThis = this;

		if (timerId) {
			clearTimeout(timerId);
		}

		// Eğer aktif bir promise yoksa veya önceki tamamlandıysa yeni bir tane oluştur
		if (!activePromise || !activeResolve || !activeReject) {
			createNewPromise();
		}

		timerId = setTimeout(() => {
			execute();
		}, currentDuration);

		// activePromise'in her zaman tanımlı olacağını garanti ediyoruz
		return activePromise!;
	};

	debouncedFunc.cancel = () => {
		if (timerId) {
			clearTimeout(timerId);
			timerId = undefined;
		}
		if (activeReject) {
			activeReject(new Error("Debounced call cancelled by user."));
		}
		resetPromiseState(); // İptal sonrası her şeyi sıfırla
	};

	debouncedFunc.flush = (): Promise<ReturnType<F> | undefined> => {
		if (timerId && lastArgs && activeResolve && activeReject) {
			// Zamanlayıcıyı temizle
			clearTimeout(timerId);
			timerId = undefined;

			// Saklanan promise'i yakala
			const promiseToReturn = activePromise;
			execute(); // Fonksiyonu hemen çalıştır
			// execute zaten resetPromiseStateAfterExecution çağıracak
			return promiseToReturn as Promise<ReturnType<F>>;
		} else if (activePromise && !timerId && lastArgs) {
			// Zamanlayıcı yok ama argümanlar ve aktif bir promise var (belki cancel sonrası flush?)
			// Bu durumda, eğer bir promise bekliyorsa ve henüz çözülmediyse, onu çözebiliriz.
			// Ancak bu senaryo genellikle "bekleyen" bir çağrı olmadığı anlamına gelir.
			// Lodash davranışı: Eğer bekleyen bir çağrı yoksa, son çağrının sonucunu döndürür (eğer varsa).
			// Bizim durumumuzda, eğer zamanlayıcı yoksa, "flush edilecek bir şey yok" anlamına gelir.
			// Ancak, eğer bir promise hala "asılı" ise ve argümanlar varsa, onu çalıştırabiliriz.
			// Bu durum biraz karmaşık, şimdilik sadece zamanlayıcı varsa flush yapalım.
		}

		// Flush edilecek aktif bir zamanlayıcı yoksa, tanımsız bir promise döndür
		return Promise.resolve(undefined);
	};

	debouncedFunc.setDuration = (newDuration: number) => {
		currentDuration = Math.max(0, newDuration); // Yeni süreyi ayarla

		// Eğer aktif bir zamanlayıcı varsa (timerId tanımlıysa) VE
		// bu zamanlayıcının ilişkili olduğu bir önceki çağrıya ait argümanlar varsa (lastArgs tanımlıysa),
		// bu, bir işlemin gerçekten beklediği anlamına gelir.
		if (timerId && lastArgs) {
			clearTimeout(timerId); // Mevcut zamanlayıcıyı iptal et

			// Yeni süreyle zamanlayıcıyı yeniden başlat.
			// Bu, aynı `activePromise`'in çözülme/reddedilme zamanını etkileyecektir.
			// `execute` fonksiyonu, saklanan `lastArgs` ve `lastThis`'i kullanacaktır.
			timerId = setTimeout(() => {
				execute();
			}, currentDuration);
		}
	};

	debouncedFunc.isPending = (): boolean => {
		return timerId !== undefined;
	};

	return debouncedFunc;
}

export function randomPickAmount<T>(arr: T[], amount: number): T[] {
	if (amount <= 0 || arr.length === 0) return [];
	if (amount >= arr.length) return arr.slice();

	const result: T[] = [];
	const usedIndices = new Set<number>();

	while (result.length < amount) {
		const index = Math.floor(Math.random() * arr.length);
		if (!usedIndices.has(index)) {
			usedIndices.add(index);
			result.push(arr[index]);
		}
	}

	return result;
}