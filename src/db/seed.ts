import { env } from "../config/env.js";
import { db, closeDatabase, initDatabase } from "./index.js";
import { documents } from "./schema.js";
import { searchDocuments } from "../tools/doc-search.js";

const SEED_DOCUMENTS: { title: string; content: string }[] = [
  {
    title: "Purchase Order Approval Workflow (ME21N)",
    content: `Purchase orders are created with transaction ME21N, normally from an approved purchase requisition. Every PO must pass the release strategy before it can be sent to the vendor. The approval limits are: up to 5,000 EUR the buyer releases the PO automatically (self-approval), from 5,000 EUR to 50,000 EUR the purchasing manager is the required approver, and above 50,000 EUR the CFO must approve in addition. The release strategy is derived automatically from the document type, purchasing group and total net value. Approvers receive work items in their SAP inbox and can approve or reject with a comment. A rejection returns the PO to the buyer with the reason attached. Framework POs and service POs use the same limits, but additionally need a confirmed cost center from the requesting department. Emergency POs created on weekends still require retroactive approval on the next working day.`,
  },
  {
    title: "Vendor Creation and Master Data (XK01 / BP)",
    content: `New vendors are created with transaction XK01 or the BP role in S/4HANA. Before activation the master data team verifies the legal name, address, tax registration number, VAT ID, IBAN bank details and a scanned trade license. A duplicate check runs automatically against existing vendors using name, tax number and bank account. The internal vendor number is assigned from number range 300000 to 399999. Required input documents are the business request form, the signed compliance questionnaire and a bank confirmation letter. After verification the category manager approves the purchasing activation. Vendors with failed tax validation remain blocked and cannot receive purchase orders. A vendor can be blocked or unblocked at any time with transaction XK05.`,
  },
  {
    title: "Goods Receipt Process (MIGO, Movement Type 101)",
    content: `Goods receipts are posted with transaction MIGO using movement type 101 and must always reference a purchase order item. The warehouse confirms the delivered quantity and, for materials with an active quality inspection setting, records the inspection lot result. The standard overdelivery tolerance is 5 percent per PO item; underdelivery is rejected unless the item allows final delivery. A goods receipt creates a material document and, for valuated stock, also an accounting document. If quality inspection is active, the stock first posts to quality inspection stock and moves to unrestricted stock after the usage decision. The printed GR note is attached to the paper delivery note. Without a valid goods receipt no invoice verification is possible, because the 3-way match compares invoice quantities against goods receipt quantities.`,
  },
  {
    title: "Invoice Verification and 3-Way Match (MIRO)",
    content: `Vendor invoices are entered and verified with transaction MIRO against the purchase order and the goods receipt. The 3-way match compares the invoice price with the PO price and the invoiced quantity with the delivered quantity. Small variances within tolerance are posted automatically: a price tolerance of 2 percent and up to 50 EUR per item is accepted without approval. Larger variances block the invoice for payment. A blocked invoice is resolved jointly by accounts payable and purchasing, either by changing the PO price, requesting a credit memo, or formally approving the variance. Payment terms default from the vendor master record and can only be changed per PO with the approval of the purchasing manager. Invoices without any PO reference are parked and clarified manually.`,
  },
  {
    title: "Purchase Requisition Process (ME51N)",
    content: `Purchase requisitions are created with transaction ME51N. A requisition contains the material or service description, quantity, requested delivery date and the cost assignment such as cost center, project or asset. Requisitions with a value of 1,000 EUR or more require the approval of the requesting department head. Approved requisitions are converted into purchase orders with transaction ME57. If no source of supply exists, source determination runs first; when no qualified vendor is found, a request for quotation is issued. Requisitions follow a release strategy with classification, and unapproved requisitions cannot be converted. A requisition can be withdrawn by the requester at any time before conversion.`,
  },
  {
    title: "Request for Quotation and Bid Comparison (ME41, ME47, ME49)",
    content: `Requests for quotation (RFQ) are created with transaction ME41 and sent to the maintained vendor list for the material or material group. The standard submission deadline is 10 working days. Incoming quotations are maintained with ME47 and compared using the price comparison ME49. The award is scored with these weights: price 60 percent, delivery time 25 percent, payment terms 10 percent, and quality certificates 5 percent. The quotation with the best total score is awarded, which directly creates a purchase order or an outline agreement. Rejected bidders are informed automatically by email. If only one quotation is received, the purchasing manager must approve the single-source award.`,
  },
  {
    title: "Source Determination and Quota Arrangements (ME01, MEQ1)",
    content: `The source list (transaction ME01) defines which vendors are allowed, preferred or blocked for a material. Quota arrangements (MEQ1) distribute planned requirements across several vendors by percentage, for example 60 percent to the primary vendor and 40 percent to the secondary vendor. A fixed source directly assigns one vendor and skips the RFQ process. Blocked sources are excluded from source determination automatically. If both a fixed source and a quota arrangement exist, the fixed source wins. Materials without any maintained source go through the full source determination and, if needed, an RFQ.`,
  },
  {
    title: "Vendor Evaluation and Scoring (ME61, ME6L)",
    content: `Vendor evaluation (ME61 for manual scores, ME6L for the list) rates every vendor on four criteria: price with a weight of 40 percent, quality with 30 percent, delivery reliability with 20 percent, and service with 10 percent. Each criterion is scored on a scale from 1 to 100, where 100 is the best. Price and delivery scores are calculated automatically from purchasing statistics and goods receipt history; quality and service can be maintained manually. A vendor scoring below 70 for two consecutive quarters is invited to a corrective action meeting. A vendor scoring below 50 is removed from all source lists. The weighted total score decides the vendor rank in award scenarios.`,
  },
  {
    title: "Payment Processing and Terms (F110)",
    content: `Verified invoices are paid by the weekly payment run F110 every Friday. The standard payment term is 30 days net. For the term 2/10 net 30 a 2 percent discount is deducted when the invoice is paid within 10 days; the discount is taken automatically whenever it is larger than 10 EUR. Supported payment methods are SEPA bank transfer and cheque. Down payments are only allowed for POs above 100,000 EUR and require a down payment request approved by the CFO plus a bank guarantee from the vendor. Invoices blocked during verification are excluded from the payment run until the block is released. Payment advices are sent to vendors by email on the payment day.`,
  },
  {
    title: "Purchase Order Changes and Cancellations (ME22N)",
    content: `Purchase orders can be changed with transaction ME22N as long as no goods receipt exists. A quantity or price change of more than 10 percent, or a delivery date change of more than 2 weeks, re-triggers the release strategy and requires re-approval. Every change creates a new version of the PO, and the vendor must confirm each new version with an order acknowledgment. After the first goods receipt the remaining open quantity can only be reduced, not increased, without creating a new PO. A PO can be cancelled completely before any goods receipt with a reason code. Cancellations after a partial goods receipt only close the open items.`,
  },
  {
    title: "Returns to Vendor (Return PO, Movement 122)",
    content: `Defective or excess goods are returned with a return PO and movement type 122, posted with MIGO referencing the original PO. The return must take place within 30 days of the goods receipt. The return delivery creates a credit memo request, which accounts payable converts into a credit memo during invoice verification. Transport costs for justified quality returns are borne by the vendor. Return quantities reduce the PO history and cannot exceed the original delivered quantity. Returns caused by an ordering error require the approval of the purchasing manager before shipping.`,
  },
  {
    title: "Material Master Procurement Views (MM01)",
    content: `Materials used in procurement are maintained with transaction MM01. The purchasing view contains the purchasing group, the material group and the planned delivery time. The MRP view defines the MRP type, safety stock and the purchasing value key that controls tolerance keys and confirmation control. The base unit of measure must match the unit used by all vendors, otherwise a conversion must be maintained. Material groups map materials to default source lists and standard vendors. A material without a maintained purchasing view cannot be ordered, and valuation requires the accounting view with the price control and valuation class.`,
  },
  {
    title: "Outline Agreements and Contracts (ME31K)",
    content: `Outline agreements are maintained with transaction ME31K. A quantity contract fixes total quantities per material for a validity period, usually 12 months, while a value contract fixes a total value. Call-off orders referencing a contract are not subject to a new release strategy as long as they stay within the contract limits. Contracts with a value above 100,000 EUR require CFO approval in the same way as purchase orders. Contract items can be blocked when budget is exhausted. The release documentation ME33K shows every call-off with date and quantity. A contract can be extended once by 6 months with the approval of the category manager.`,
  },
  {
    title: "Approval Limits and Delegation of Authority (DOA)",
    content: `The delegation of authority matrix defines the spending thresholds per role. A buyer can self-approve purchases up to 5,000 EUR. The purchasing manager approves values from 5,000 EUR to 50,000 EUR. The CFO approves from 50,000 EUR to 500,000 EUR. Purchases above 500,000 EUR require board approval. The thresholds apply per document and per contract call-off. Splitting a purchase into several smaller documents to stay under a threshold is not allowed and is treated as a compliance violation. An approval is valid for 90 days; after that the document must be re-approved if it has not yet been sent to the vendor.`,
  },
];

async function main() {
  console.log(`[seed] target database: ${env.databaseUrl}`);
  await initDatabase();
  await db.delete(documents);

  const inserted = await db
    .insert(documents)
    .values(SEED_DOCUMENTS)
    .returning({ id: documents.id, title: documents.title });

  console.log(`[seed] inserted ${inserted.length} documents:\n`);
  for (const doc of inserted) console.log(`   ${doc.id}. ${doc.title}`);

  console.log("\n[seed] full-text search self-test:");
  const testQueries = [
    "invoice tolerance",
    "vendor evaluation weights",
    "approval limits CFO",
  ];
  for (const q of testQueries) {
    const hits = await searchDocuments(q, 3);
    console.log(
      `   query="${q}" -> ${hits.map((h) => h.title).join(" | ") || "(no results)"}`
    );
  }

  await closeDatabase();
  console.log("\n[seed] done.");
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});