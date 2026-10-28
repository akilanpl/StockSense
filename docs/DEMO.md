# Odoo finals demo rehearsal

Use a separate demo database and a real SMTP provider, or the local SMTP fixture for rehearsal. Never demonstrate against business inventory. Set `APP_ORIGIN` to the actual URL. Approve presenter email addresses in `SIGNUP_ALLOWED_EMAILS`; enable public signup only in a controlled demo with disposable data.

## Five-minute story

“Our warehouse receives goods, sends some to another rack, fulfills an order, and reconciles a discrepancy. Every posted movement is traceable, and an impossible delivery does not corrupt inventory.”

| Step | Action in the application | Expected stock for the demo product |
|---|---|---|
| 1 | Sign up, verify email, sign in | Dashboard opens; authenticated user is visible |
| 2 | Products → Add Product; create category and PCS unit if necessary | New SKU is available in operation forms |
| 3 | Warehouses → create Finals Warehouse; Locations → create internal Rack A and Rack B | Both locations appear in operations |
| 4 | Receipts → create receipt for 100 into Rack A; Mark ready; Validate | A=100, B=0; receipt Done |
| 5 | Transfers → move 30 from A to B; Mark as Ready; Validate | A=70, B=30; transfer Done |
| 6 | Deliveries → deliver 20 from B; Mark as Ready; Validate | A=70, B=10; delivery Done |
| 7 | Adjustments → record physical count 8 in B; Mark ready; Validate | A=70, B=8; adjustment of minus 2 |
| 8 | Stock → search for SKU; Move History → search for SKU | Balances 70/8; movements 100, 30, 20, 2 |
| 9 | Attempt to deliver 9 from B | Clear insufficient-stock error; operation stays Ready; no new movement |
| 10 | Dashboard | Current inventory summary and pending failed delivery remain consistent |

References can be left blank to get unique generated references. Give explicit references on stage only when you know they have not been used in that database. To rehearse again, create a new SKU and new references; completed stock history is intentionally preserved.

## Questions to rehearse

- “Can I post twice?” A completed operation rejects another validation; it cannot double-post stock.
- “Can an adjustment count zero?” Yes. It removes the recorded balance and writes the actual difference to the ledger.
- “What if the count already matches?” It completes without a fake zero movement.
- “What if two users act together?” Operation locks serialize validation, cancellation, readiness and line edits. Product/location locks prevent concurrent overselling.
- “What if the email fails?” Signup reports failure; production requires configured SMTP. Rehearse external email delivery before stage time.
- “Is this integrated with Odoo?” This is a standalone inventory application for the finals. No Odoo API connector is implemented.

Do one uninterrupted rehearsal using the exact deployed build, browser, URL, credentials, SMTP provider and network you will use on stage. Keep an already verified presenter account as a fallback to email/network delays.
