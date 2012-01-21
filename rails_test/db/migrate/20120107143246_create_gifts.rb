class CreateGifts < ActiveRecord::Migration
  def change
    create_table :gifts do |t|
      t.string :description
      t.integer :from_person_id
      t.integer :to_person_id
      t.timestamps
    end
  end
end
