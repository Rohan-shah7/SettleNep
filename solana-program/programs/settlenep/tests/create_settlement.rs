use {
    anchor_lang::{
        prelude::Pubkey,
        solana_program::{instruction::Instruction, system_program},
        AccountDeserialize, InstructionData, ToAccountMetas,
    },
    litesvm::LiteSVM,
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
    settlenep::{
        accounts::CreateSettlement as CreateSettlementAccounts,
        constants::{MAX_ALLOCATIONS, PURPOSE_EDUCATION, PURPOSE_FAMILY, SETTLEMENT_SEED},
        instruction::CreateSettlement as CreateSettlementData,
        state::{Allocation, Settlement},
    },
};

const AIRDROP: u64 = 10_000_000_000;
const TX_FEE: u64 = 5_000;

fn svm() -> LiteSVM {
    let mut svm = LiteSVM::new();
    let bytes = include_bytes!(concat!(
        env!("CARGO_TARGET_TMPDIR"),
        "/../deploy/settlenep.so"
    ));
    svm.add_program(settlenep::id(), bytes).unwrap();
    svm
}

fn settlement_address(program_id: &Pubkey, sender: &Pubkey, nonce: u64) -> Pubkey {
    Pubkey::find_program_address(
        &[SETTLEMENT_SEED, sender.as_ref(), &nonce.to_le_bytes()],
        program_id,
    )
    .0
}

fn send(svm: &mut LiteSVM, payer: &Keypair, ix: Instruction) -> Result<(), String> {
    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[ix], Some(&payer.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[payer]).unwrap();
    svm.send_transaction(tx).map(|_| ()).map_err(|e| format!("{e:?}"))
}

fn create_ix(
    program_id: &Pubkey,
    sender: &Pubkey,
    recipient: &Pubkey,
    settlement: &Pubkey,
    amount: u64,
    reference: [u8; 32],
    allocations: Vec<Allocation>,
    nonce: u64,
) -> Instruction {
    let metas = CreateSettlementAccounts {
        sender: *sender,
        recipient: *recipient,
        settlement: *settlement,
        system_program: system_program::ID,
    }
    .to_account_metas(None);
    Instruction::new_with_bytes(
        *program_id,
        &CreateSettlementData {
            nonce,
            amount,
            reference,
            allocations,
        }
        .data(),
        metas,
    )
}

fn read_settlement(svm: &LiteSVM, address: &Pubkey) -> Settlement {
    let account = svm.get_account(address).unwrap();
    let mut data: &[u8] = &account.data;
    Settlement::try_deserialize(&mut data).unwrap()
}

#[test]
fn test_create_settlement_success() {
    let program_id = settlenep::id();
    let mut svm = svm();
    let sender = Keypair::new();
    let recipient = Keypair::new();
    svm.airdrop(&sender.pubkey(), AIRDROP).unwrap();
    svm.airdrop(&recipient.pubkey(), AIRDROP).unwrap();

    let nonce = 1u64;
    let amount = 1_000_000u64;
    let mut reference = [0u8; 32];
    reference[0..5].copy_from_slice(b"ref-1");
    let allocations = vec![
        Allocation {
            purpose: PURPOSE_FAMILY,
            amount: 400_000,
        },
        Allocation {
            purpose: PURPOSE_EDUCATION,
            amount: 600_000,
        },
    ];
    let settlement = settlement_address(&program_id, &sender.pubkey(), nonce);

    let sender_before = svm.get_balance(&sender.pubkey()).unwrap();
    let recipient_before = svm.get_balance(&recipient.pubkey()).unwrap();

    let ix = create_ix(
        &program_id,
        &sender.pubkey(),
        &recipient.pubkey(),
        &settlement,
        amount,
        reference,
        allocations.clone(),
        nonce,
    );
    assert!(send(&mut svm, &sender, ix).is_ok());

    let state = read_settlement(&svm, &settlement);
    assert_eq!(state.sender, sender.pubkey());
    assert_eq!(state.recipient, recipient.pubkey());
    assert_eq!(state.amount, amount);
    assert_eq!(state.reference, reference);
    assert_eq!(state.allocation_count, 2);
    assert_eq!(state.allocations[0].purpose, allocations[0].purpose);
    assert_eq!(state.allocations[0].amount, allocations[0].amount);
    assert_eq!(state.allocations[1].purpose, allocations[1].purpose);
    assert_eq!(state.allocations[1].amount, allocations[1].amount);
    assert_eq!(state.status, settlenep::constants::SETTLED);
    assert_eq!(state.nonce, nonce);

    let sandbox = svm.get_account(&settlement).unwrap().lamports;
    assert_eq!(
        svm.get_balance(&recipient.pubkey()).unwrap(),
        recipient_before + amount,
    );
    assert_eq!(
        svm.get_balance(&sender.pubkey()).unwrap(),
        sender_before - amount - sandbox - TX_FEE,
    );
}

#[test]
fn test_duplicate_nonce_rejected() {
    let program_id = settlenep::id();
    let mut svm = svm();
    let sender = Keypair::new();
    let recipient = Keypair::new();
    svm.airdrop(&sender.pubkey(), AIRDROP).unwrap();
    svm.airdrop(&recipient.pubkey(), AIRDROP).unwrap();

    let nonce = 7u64;
    let amount = 500_000u64;
    let allocations = vec![Allocation {
        purpose: PURPOSE_FAMILY,
        amount,
    }];
    let settlement = settlement_address(&program_id, &sender.pubkey(), nonce);
    let ix = create_ix(
        &program_id,
        &sender.pubkey(),
        &recipient.pubkey(),
        &settlement,
        amount,
        [0u8; 32],
        allocations,
        nonce,
    );

    assert!(send(&mut svm, &sender, ix.clone()).is_ok());
    assert!(send(&mut svm, &sender, ix).is_err());
}

#[test]
fn test_zero_amount_rejected() {
    let program_id = settlenep::id();
    let mut svm = svm();
    let sender = Keypair::new();
    let recipient = Keypair::new();
    svm.airdrop(&sender.pubkey(), AIRDROP).unwrap();
    svm.airdrop(&recipient.pubkey(), AIRDROP).unwrap();

    let settlement = settlement_address(&program_id, &sender.pubkey(), 1);
    let ix = create_ix(
        &program_id,
        &sender.pubkey(),
        &recipient.pubkey(),
        &settlement,
        0,
        [0u8; 32],
        vec![Allocation {
            purpose: PURPOSE_FAMILY,
            amount: 0,
        }],
        1,
    );
    assert!(send(&mut svm, &sender, ix).is_err());
}

#[test]
fn test_no_allocations_rejected() {
    let program_id = settlenep::id();
    let mut svm = svm();
    let sender = Keypair::new();
    let recipient = Keypair::new();
    svm.airdrop(&sender.pubkey(), AIRDROP).unwrap();
    svm.airdrop(&recipient.pubkey(), AIRDROP).unwrap();

    let settlement = settlement_address(&program_id, &sender.pubkey(), 1);
    let ix = create_ix(
        &program_id,
        &sender.pubkey(),
        &recipient.pubkey(),
        &settlement,
        1_000,
        [0u8; 32],
        vec![],
        1,
    );
    assert!(send(&mut svm, &sender, ix).is_err());
}

#[test]
fn test_too_many_allocations_rejected() {
    let program_id = settlenep::id();
    let mut svm = svm();
    let sender = Keypair::new();
    let recipient = Keypair::new();
    svm.airdrop(&sender.pubkey(), AIRDROP).unwrap();
    svm.airdrop(&recipient.pubkey(), AIRDROP).unwrap();

    let settlement = settlement_address(&program_id, &sender.pubkey(), 1);
    let allocations = (0..MAX_ALLOCATIONS + 1)
        .map(|i| Allocation {
            purpose: i as u8,
            amount: 1,
        })
        .collect::<Vec<_>>();
    let ix = create_ix(
        &program_id,
        &sender.pubkey(),
        &recipient.pubkey(),
        &settlement,
        allocations.len() as u64,
        [0u8; 32],
        allocations,
        1,
    );
    assert!(send(&mut svm, &sender, ix).is_err());
}

#[test]
fn test_allocation_mismatch_rejected() {
    let program_id = settlenep::id();
    let mut svm = svm();
    let sender = Keypair::new();
    let recipient = Keypair::new();
    svm.airdrop(&sender.pubkey(), AIRDROP).unwrap();
    svm.airdrop(&recipient.pubkey(), AIRDROP).unwrap();

    let settlement = settlement_address(&program_id, &sender.pubkey(), 1);
    let allocations = vec![
        Allocation {
            purpose: PURPOSE_FAMILY,
            amount: 600_000,
        },
        Allocation {
            purpose: PURPOSE_EDUCATION,
            amount: 300_000,
        },
    ];
    let ix = create_ix(
        &program_id,
        &sender.pubkey(),
        &recipient.pubkey(),
        &settlement,
        1_000_000,
        [0u8; 32],
        allocations,
        1,
    );
    assert!(send(&mut svm, &sender, ix).is_err());
}

#[test]
fn test_invalid_recipient_rejected() {
    let program_id = settlenep::id();
    let mut svm = svm();
    let sender = Keypair::new();
    svm.airdrop(&sender.pubkey(), AIRDROP).unwrap();

    let settlement = settlement_address(&program_id, &sender.pubkey(), 1);
    let mut metas = settlenep::accounts::CreateSettlement {
        sender: sender.pubkey(),
        recipient: system_program::ID,
        settlement,
        system_program: system_program::ID,
    }
    .to_account_metas(None);
    metas[1].is_writable = false;
    let ix = Instruction::new_with_bytes(
        program_id,
        &CreateSettlementData {
            nonce: 1,
            amount: 1_000,
            reference: [0u8; 32],
            allocations: vec![Allocation {
                purpose: PURPOSE_FAMILY,
                amount: 1_000,
            }],
        }
        .data(),
        metas,
    );
    assert!(send(&mut svm, &sender, ix).is_err());
}

#[test]
fn test_recipient_is_settlement_rejected() {
    let program_id = settlenep::id();
    let mut svm = svm();
    let sender = Keypair::new();
    svm.airdrop(&sender.pubkey(), AIRDROP).unwrap();

    let settlement = settlement_address(&program_id, &sender.pubkey(), 1);
    let ix = create_ix(
        &program_id,
        &sender.pubkey(),
        &settlement,
        &settlement,
        1_000,
        [0u8; 32],
        vec![Allocation {
            purpose: PURPOSE_FAMILY,
            amount: 1_000,
        }],
        1,
    );
    assert!(send(&mut svm, &sender, ix).is_err());
}

#[test]
fn test_allocation_overflow_rejected() {
    let program_id = settlenep::id();
    let mut svm = svm();
    let sender = Keypair::new();
    let recipient = Keypair::new();
    svm.airdrop(&sender.pubkey(), AIRDROP).unwrap();
    svm.airdrop(&recipient.pubkey(), AIRDROP).unwrap();

    let settlement = settlement_address(&program_id, &sender.pubkey(), 1);
    let allocations = vec![
        Allocation {
            purpose: 0,
            amount: u64::MAX,
        };
        MAX_ALLOCATIONS
    ];
    let ix = create_ix(
        &program_id,
        &sender.pubkey(),
        &recipient.pubkey(),
        &settlement,
        1,
        [0u8; 32],
        allocations,
        1,
    );
    assert!(send(&mut svm, &sender, ix).is_err());
}

#[test]
fn test_refunds_do_not_create_settlement_on_failure() {
    let program_id = settlenep::id();
    let mut svm = svm();
    let sender = Keypair::new();
    let recipient = Keypair::new();
    svm.airdrop(&sender.pubkey(), AIRDROP).unwrap();
    svm.airdrop(&recipient.pubkey(), AIRDROP).unwrap();

    let settlement = settlement_address(&program_id, &sender.pubkey(), 1);
    let ix = create_ix(
        &program_id,
        &sender.pubkey(),
        &recipient.pubkey(),
        &settlement,
        1_000,
        [0u8; 32],
        vec![Allocation {
            purpose: PURPOSE_FAMILY,
            amount: 999,
        }],
        1,
    );
assert!(send(&mut svm, &sender, ix).is_err());
    assert!(svm.get_account(&settlement).is_none());
    assert_eq!(svm.get_balance(&recipient.pubkey()).unwrap(), AIRDROP);
    assert_eq!(
        svm.get_balance(&sender.pubkey()).unwrap(),
        AIRDROP - TX_FEE,
    );
}