#!/usr/bin/env node
// cpu-oc-tally - deterministic score tally across Geekbench 6 CPU runs vs the stock baseline.
// Reads receipts/cpu-oc-receipts.json (schema cpu-oc-receipts.v1) and prints:
//   1. one table line per run: SC, SC%, gate verdict, MC, MC%, gate verdict
//   2. best SC / best MC with URLs, and whether ANY single run passed both gates
//   3. per-run MC sub-test deltas vs baseline (worst holes first) for runs that carry subtests
// Zero dependency, fixed-width, sorted by date+url: same bytes for same input.
import { readFileSync } from 'node:fs';

interface Subtests { sc?: Record<string, number>; mc?: Record<string, number> }
interface Run { date: string; url: string; id: string; sc: number; mc: number; condition?: string; subtests?: Subtests }
interface Ledger {
	schema: string;
	gates: { singleCore101: number; multiCore101: number };
	stockBaseline: { singleCore: number; multiCore: number; url: string; subtests?: Subtests };
	runs: Run[];
}

const pct = (v: number): string => `${(v * 100).toFixed(2)}%`;

function movers(label: string, run: Run, base: Subtests | undefined): string[] {
	const out: string[] = [];
	if (!run.subtests?.mc || !base?.mc) return out;
	out.push(`${label} MC subtests vs baseline (worst first):`);
	const rows = Object.entries(run.subtests.mc)
		.filter(([k]) => base.mc![k] !== undefined)
		.map(([k, v]) => ({ k, v, d: v / base.mc![k] - 1 }))
		.sort((a, b) => a.d - b.d || a.k.localeCompare(b.k));
	for (const r of rows) out.push(`  ${r.k.padEnd(20)} ${String(base.mc![r.k]).padStart(5)} -> ${String(r.v).padStart(5)}  ${(r.d >= 0 ? '+' : '') + (r.d * 100).toFixed(1)}%`);
	return out;
}

function tally(ledger: Ledger): string {
	const out: string[] = [];
	const base = ledger.stockBaseline;
	const gSc = ledger.gates.singleCore101;
	const gMc = ledger.gates.multiCore101;
	out.push(`baseline SC ${base.singleCore} MC ${base.multiCore} ${base.url}`);
	out.push(`gates SC >= ${gSc} MC >= ${gMc}`);
	out.push('');
	out.push('run        SC     SC%      gate  MC     MC%      gate  id');
	const sorted = [...ledger.runs].sort((a, b) => `${a.date}${a.url}`.localeCompare(`${b.date}${b.url}`));
	let both = false;
	let bestSc = sorted[0];
	let bestMc = sorted[0];
	for (const r of sorted) {
		if (r.sc > bestSc.sc) bestSc = r;
		if (r.mc > bestMc.mc) bestMc = r;
	}
	for (const r of sorted) {
		const scPass = r.sc >= gSc;
		const mcPass = r.mc >= gMc;
		if (scPass && mcPass) both = true;
		out.push(
			`${r.url.slice(-6)}  ${String(r.sc).padStart(5)}  ${pct(r.sc / base.singleCore).padStart(8)}  ${scPass ? 'PASS' : 'fail'}  ${String(r.mc).padStart(5)}  ${pct(r.mc / base.multiCore).padStart(8)}  ${mcPass ? 'PASS' : 'fail'}  ${r.id}`,
		);
	}
	out.push('');
	out.push(`best SC ${bestSc.sc} (${pct(bestSc.sc / base.singleCore)}) ${bestSc.url}`);
	out.push(`best MC ${bestMc.mc} (${pct(bestMc.mc / base.multiCore)}) ${bestMc.url}`);
	out.push(`BOTH_GATES_IN_ONE_RUN=${both ? 'MET' : 'NOT_MET'}`);
	for (const r of sorted) out.push('', ...movers(r.id, r, base.subtests));
	return out.join('\n');
}

const fixture: Ledger = {
	schema: 'cpu-oc-receipts.v1',
	gates: { singleCore101: 1010, multiCore101: 5050 },
	stockBaseline: {
		singleCore: 1000,
		multiCore: 5000,
		url: 'https://browser.geekbench.com/v6/cpu/1',
		subtests: { mc: { 'Ray Tracer': 1000, Clang: 2000 } },
	},
	runs: [
		{ date: 'd1', url: 'https://browser.geekbench.com/v6/cpu/11', id: 'r1', sc: 1005, mc: 4900, condition: 'stock' },
		{ date: 'd2', url: 'https://browser.geekbench.com/v6/cpu/22', id: 'r2', sc: 1020, mc: 5100, subtests: { mc: { 'Ray Tracer': 1100, Clang: 1900 } } },
	],
};

function main(): void {
	const arg = process.argv[2] ?? 'receipts/cpu-oc-receipts.json';
	const ledger = arg === 'selftest' ? fixture : (JSON.parse(readFileSync(arg, 'utf8')) as Ledger);
	if (ledger.schema !== 'cpu-oc-receipts.v1') throw new Error(`unknown schema ${ledger.schema}`);
	console.log(tally(ledger));
	if (arg === 'selftest') {
		const text = tally(ledger);
		if (!text.includes('BOTH_GATES_IN_ONE_RUN=MET')) throw new Error('r2 should pass both gates');
		if (!text.includes('2000 ->  1900  -5.0%')) throw new Error('mover line mismatch');
		if (!text.includes('best MC 5100')) throw new Error('best MC mismatch');
		console.log('CPU_OC_TALLY=PASS');
	}
}

main();
