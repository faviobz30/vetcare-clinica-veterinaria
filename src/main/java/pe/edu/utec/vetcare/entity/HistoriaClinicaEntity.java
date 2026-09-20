package pe.edu.utec.vetcare.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "historia_clinica")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HistoriaClinicaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_historia")
    private Long idHistoria;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "id_mascota",
            nullable = false,
            unique = true
    )
    private MascotaEntity mascota;

    @Column(
            name = "fecha_apertura",
            nullable = false
    )
    private LocalDateTime fechaApertura;

    @PrePersist
    public void prePersist() {

        if (fechaApertura == null) {
            fechaApertura = LocalDateTime.now();
        }
    }
}